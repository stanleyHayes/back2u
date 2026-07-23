import { DEFAULT_CURRENCY, type CreateItemInput, type ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { Item } from '../../../domain/item/item.entity.js';
import { ModerationQueueItem } from '../../../domain/moderation/moderation-queue-item.entity.js';
import { Reward } from '../../../domain/reward/reward.entity.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IAppUrls } from '../../ports/extra-services.js';
import type { IQueue } from '../../ports/queue.js';
import type {
  IItemRepository,
  IModerationQueueRepository,
  IRewardRepository,
  IUserRepository,
  IZoneSubscriptionRepository,
} from '../../ports/repositories.js';
import type {
  IAiMatchingService,
  IContentModeration,
  IEmailService,
  IImageStorage,
  ILogger,
  IPaymentEscrowService,
  IPerceptualHashService,
  IPushService,
} from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { toItemDTO } from '../mappers/item.mapper.js';
import { GenerateMatchesUseCase } from '../match/generate-matches.js';

const DUPLICATE_HAMMING_THRESHOLD = 10;

@injectable()
export class CreateItemUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RewardRepository) private readonly rewards: IRewardRepository,
    @inject(TOKENS.ModerationQueueRepository) private readonly moderationQueue: IModerationQueueRepository,
    @inject(TOKENS.ZoneSubscriptionRepository) private readonly zones: IZoneSubscriptionRepository,
    @inject(TOKENS.AiMatchingService) private readonly ai: IAiMatchingService,
    @inject(TOKENS.ContentModeration) private readonly moderation: IContentModeration,
    @inject(TOKENS.ImageStorage) private readonly imageStorage: IImageStorage,
    @inject(TOKENS.PerceptualHash) private readonly phash: IPerceptualHashService,
    @inject(TOKENS.PaymentEscrow) private readonly escrow: IPaymentEscrowService,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.PushService) private readonly push: IPushService,
    @inject(TOKENS.AppUrls) private readonly appUrls: IAppUrls,
    @inject(TOKENS.Queue) private readonly queue: IQueue,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(GenerateMatchesUseCase) private readonly generateMatches: GenerateMatchesUseCase,
  ) {}

  // Routes call this either as execute(userId, input) or execute({ ...input, postedById }).
  async execute(input: CreateItemInput & { postedById: Id }): Promise<ItemDTO>;
  async execute(userId: Id, input: CreateItemInput): Promise<ItemDTO>;
  async execute(
    a: Id | (CreateItemInput & { postedById?: Id }),
    b?: CreateItemInput,
  ): Promise<ItemDTO> {
    const userId = typeof a === 'string' ? a : (a.postedById as Id);
    const input = typeof a === 'string' ? (b as CreateItemInput) : a;
    const item = Item.create({
      id: newId(),
      kind: input.kind,
      classification: input.classification,
      title: input.title,
      description: input.description,
      category: input.category,
      tags: input.tags ?? [],
      images: input.images,
      place: input.place,
      occurredAt: new Date(input.occurredAt),
      postedById: userId,
      institutionId: input.institutionId,
      qrTagCode: input.qrTagCode,
      serialNumber: input.serialNumber,
      imei: input.imei,
    });

    const mod = await this.moderation.scoreMessage(`${input.title}\n${input.description}`);
    if (mod.flagged) {
      item.flagForReview();
      await this.moderationQueue.save(
        ModerationQueueItem.create({
          id: newId(),
          type: 'item',
          targetId: item.id,
          reason: mod.reason ?? 'Content flagged by automated moderation',
          score: 1,
        }),
      );
    }

    // Embeddings power semantic matching; a failure must not block posting.
    try {
      const textEmbedding = await this.ai.embedText(
        [input.title, input.description, input.category, ...(input.tags ?? [])].join(' '),
      );
      const imageEmbedding = input.images[0]
        ? await this.ai.embedImage(input.images[0].url)
        : undefined;
      item.setEmbeddings(textEmbedding, imageEmbedding);
    } catch (err) {
      this.logger.warn('item embedding failed', { itemId: item.id, error: (err as Error).message });
    }

    // Perceptual-hash duplicate detection on the first photo.
    if (input.images[0]) {
      try {
        const bytes = await this.imageStorage.fetchBytes(input.images[0].url);
        const hash = await this.phash.hash(bytes);
        item.setPerceptualHash(hash);
        const candidates = await this.items.findByPerceptualHash(hash, DUPLICATE_HAMMING_THRESHOLD);
        const dup = candidates.find(
          (c) =>
            c.snapshot.perceptualHash !== undefined &&
            this.phash.isDuplicate(hash, c.snapshot.perceptualHash, DUPLICATE_HAMMING_THRESHOLD),
        );
        if (dup) {
          item.markDuplicateOf(dup.id);
          item.flagForReview();
          await this.moderationQueue.save(
            ModerationQueueItem.create({
              id: newId(),
              type: 'item',
              targetId: item.id,
              reason: `Possible duplicate of item ${dup.id}`,
              score: 1,
            }),
          );
        }
      } catch (err) {
        this.logger.warn('perceptual hash failed', { itemId: item.id, error: (err as Error).message });
      }
    }

    // Reward: hold the funds in escrow before the item goes live.
    if (input.rewardAmount && input.rewardAmount > 0) {
      const poster = await this.users.findById(userId);
      const reward = Reward.create({
        id: newId(),
        itemId: item.id,
        amount: input.rewardAmount,
        currency: DEFAULT_CURRENCY,
      });
      await this.escrow.hold({
        rewardId: reward.snapshot.id,
        amount: reward.snapshot.amount,
        currency: reward.snapshot.currency,
        payerPhone: poster?.snapshot.phone,
      });
      reward.hold();
      await this.rewards.save(reward);
      item.attachReward(reward.snapshot.id);
    }

    await this.items.save(item);

    // Zone fan-out alerts subscribers whose zones contain the item's location.
    void this.fanoutToZones(item).catch((err: unknown) =>
      this.logger.warn('zone fan-out failed', { itemId: item.id, error: (err as Error).message }),
    );

    await this.queue.enqueue('match.generate', { itemId: item.id });
    await this.queue.enqueue('audit.write', {
      actorId: userId,
      action: 'item.create',
      entity: 'item',
      entityId: item.id,
    });
    // Immediate pass so matches exist even when the queue worker is not running.
    void this.generateMatches.execute(item.id).catch((err: unknown) =>
      this.logger.warn('match generation failed', { itemId: item.id, error: (err as Error).message }),
    );

    return toItemDTO(item);
  }

  private async fanoutToZones(item: Item): Promise<void> {
    const [lng, lat] = item.snapshot.place.point.coordinates;
    const zones = await this.zones.findContaining({ lng, lat });
    for (const zone of zones) {
      const ownerId = zone.snapshot.ownerId;
      if (ownerId === item.snapshot.postedById) continue;
      const owner = await this.users.findById(ownerId);
      if (!owner) continue;
      if (zone.snapshot.channels.includes('email')) {
        void this.email
          .sendMatchAlert(
            owner.snapshot.email,
            owner.snapshot.name,
            item.snapshot.title,
            this.appUrls.itemDetail(item.id),
            owner.snapshot.locale,
          )
          .catch(() => {});
      }
      if (zone.snapshot.channels.includes('push') && owner.snapshot.pushTokens.length > 0) {
        void this.push
          .send(owner.snapshot.pushTokens, 'New item in your zone', item.snapshot.title, {
            itemId: item.id,
          })
          .catch(() => {});
      }
    }
  }
}
