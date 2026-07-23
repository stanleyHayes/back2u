import type { MatchDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { Item } from '../../../domain/item/item.entity.js';
import { Match } from '../../../domain/match/match.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IAppUrls } from '../../ports/extra-services.js';
import type {
  IItemRepository,
  IMatchRepository,
  INotificationRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type {
  IAiMatchingService,
  IEmailService,
  ILogger,
  IPushService,
  IRealtimeBus,
} from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const RADIUS_METERS = 5_000;
const DAYS_WINDOW = 14;
const CANDIDATE_LIMIT = 50;
const MATCH_THRESHOLD = 0.55;
const MS_PER_DAY = 86_400_000;

export function toMatchDTO(m: Match): MatchDTO {
  const s = m.snapshot;
  return {
    id: s.id,
    lostItemId: s.lostItemId,
    foundItemId: s.foundItemId,
    score: s.score,
    imageScore: s.imageScore,
    textScore: s.textScore,
    geoScore: s.geoScore,
    timeScore: s.timeScore,
    status: s.status,
    returnConfirmedByLost: s.returnConfirmedByLost,
    returnConfirmedByFound: s.returnConfirmedByFound,
    returnedAt: s.returnedAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    ((err as { code?: unknown }).code === 11000 ||
      String((err as { message?: unknown }).message ?? '').includes('E11000'))
  );
}

function distanceMeters(a: [number, number], b: [number, number]): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

@injectable()
export class GenerateMatchesUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.AiMatchingService) private readonly ai: IAiMatchingService,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.PushService) private readonly push: IPushService,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.AppUrls) private readonly urls: IAppUrls,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(itemId: Id): Promise<MatchDTO[]> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');

    const candidates = await this.items.findCandidatesFor(item, {
      radiusMeters: RADIUS_METERS,
      daysWindow: DAYS_WINDOW,
      limit: CANDIDATE_LIMIT,
    });

    const created: Match[] = [];
    for (const candidate of candidates) {
      if (candidate.id === item.id || candidate.snapshot.kind === item.snapshot.kind) continue;

      const lost = item.snapshot.kind === 'lost' ? item : candidate;
      const found = item.snapshot.kind === 'lost' ? candidate : item;

      const existing = await this.matches.findByPair(lost.id, found.id);
      if (existing) continue;

      const [imageScore, textScore] = await Promise.all([
        this.cosineOf(await this.imageEmbeddingOf(item), await this.imageEmbeddingOf(candidate)),
        this.cosineOf(await this.textEmbeddingOf(item), await this.textEmbeddingOf(candidate)),
      ]);
      const geoScore = clamp01(
        1 - distanceMeters(item.snapshot.place.point.coordinates, candidate.snapshot.place.point.coordinates) / RADIUS_METERS,
      );
      const timeScore = clamp01(
        1 -
          Math.abs(item.snapshot.occurredAt.getTime() - candidate.snapshot.occurredAt.getTime()) /
            (DAYS_WINDOW * MS_PER_DAY),
      );

      const match = Match.suggest({
        id: newId(),
        lostItemId: lost.id,
        foundItemId: found.id,
        imageScore,
        textScore,
        geoScore,
        timeScore,
      });
      if (match.snapshot.score < MATCH_THRESHOLD) continue;

      // Item creation triggers generation asynchronously, so a concurrent run can
      // pass the findByPair check above and then race this save; the unique
      // (lostItemId, foundItemId) index is the final arbiter.
      try {
        await this.matches.save(match);
      } catch (err) {
        if (isDuplicateKeyError(err)) continue;
        throw err;
      }
      created.push(match);
      await this.notifyPosters(match, lost, found);
    }

    return created.map(toMatchDTO);
  }

  private async cosineOf(a: number[] | undefined, b: number[] | undefined): Promise<number> {
    if (!a || !b) return 0;
    try {
      return clamp01(this.ai.cosine(a, b));
    } catch {
      return 0;
    }
  }

  private async textEmbeddingOf(item: Item): Promise<number[] | undefined> {
    const existing = item.snapshot.textEmbedding;
    if (existing && existing.length > 0) return existing;
    try {
      const s = item.snapshot;
      const vec = await this.ai.embedText([s.title, s.description, s.category, ...s.tags].join(' '));
      item.setEmbeddings(vec, undefined);
      await this.items.save(item);
      return vec;
    } catch (err) {
      this.logger.warn('text embedding failed', { itemId: item.id, err: String(err) });
      return undefined;
    }
  }

  private async imageEmbeddingOf(item: Item): Promise<number[] | undefined> {
    const existing = item.snapshot.imageEmbedding;
    if (existing && existing.length > 0) return existing;
    const first = item.snapshot.images[0];
    if (!first) return undefined;
    try {
      const vec = await this.ai.embedImage(first.url);
      item.setEmbeddings(undefined, vec);
      await this.items.save(item);
      return vec;
    } catch (err) {
      this.logger.warn('image embedding failed', { itemId: item.id, err: String(err) });
      return undefined;
    }
  }

  private async notifyPosters(match: Match, lost: Item, found: Item): Promise<void> {
    const sides = [
      { userId: lost.snapshot.postedById, other: found },
      { userId: found.snapshot.postedById, other: lost },
    ];
    for (const side of sides) {
      const title = 'Possible match found';
      const body = `An item matching "${side.other.snapshot.title}" was posted near you.`;
      const data = {
        matchId: match.snapshot.id,
        itemId: side.other.id,
        itemTitle: side.other.snapshot.title,
        score: match.snapshot.score,
      };
      const url = this.urls.matches();

      await this.notifications.save(
        Notification.create({ id: newId(), userId: side.userId, type: 'match', title, body, data, url }),
      );
      this.bus.publishToUser(side.userId, 'match:suggested', data);

      const user = await this.users.findById(side.userId);
      if (!user) continue;
      void this.email
        .sendMatchAlert(user.email, user.snapshot.name, side.other.snapshot.title, url, user.snapshot.locale)
        .catch(() => {});
      if (user.snapshot.pushTokens.length > 0) {
        void this.push.send(user.snapshot.pushTokens, title, body, data).catch(() => {});
      }
    }
  }
}
