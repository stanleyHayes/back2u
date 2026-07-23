import type { MatchDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IAuditLogRepository,
  IItemRepository,
  IMatchRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { toMatchDTO } from './generate-matches.js';

@injectable()
export class ConfirmItemReturnUseCase {
  constructor(
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}

  async execute(matchId: Id, userId: Id): Promise<MatchDTO> {
    const match = await this.matches.findById(matchId);
    if (!match) throw new NotFoundError('Match');
    const lost = await this.items.findById(match.snapshot.lostItemId);
    const found = await this.items.findById(match.snapshot.foundItemId);
    if (!lost || !found) throw new NotFoundError('Item');
    if (match.snapshot.status !== 'accepted' && match.snapshot.status !== 'verified') {
      throw new ConflictError('Match must be accepted before confirming the return');
    }

    if (userId === lost.snapshot.postedById) {
      match.confirmReturnByLost(userId);
    } else if (userId === found.snapshot.postedById) {
      match.confirmReturnByFound(userId);
    } else {
      throw new ForbiddenError('Not a match participant');
    }

    const s = match.snapshot;
    if (s.returnConfirmedByLost && s.returnConfirmedByFound && !s.returnedAt) {
      match.markReturned();
      lost.markReturned();
      found.markReturned();

      const lostOwner = await this.users.findById(lost.snapshot.postedById);
      const foundOwner = await this.users.findById(found.snapshot.postedById);

      if (lostOwner) {
        lostOwner.awardPoints(50, 10);
        lostOwner.recordSuccessfulReturn();
        await this.users.save(lostOwner);
      }
      if (foundOwner) {
        foundOwner.awardPoints(50, 10);
        foundOwner.recordSuccessfulReturn();
        await this.users.save(foundOwner);
      }

      await Promise.all([this.items.save(lost), this.items.save(found)]);

      this.bus.publishToUser(lost.snapshot.postedById, 'item:returned', {
        matchId: match.snapshot.id,
        lostItemId: lost.id,
        foundItemId: found.id,
      });
      this.bus.publishToUser(found.snapshot.postedById, 'item:returned', {
        matchId: match.snapshot.id,
        lostItemId: lost.id,
        foundItemId: found.id,
      });
    }

    await this.matches.save(match);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: userId,
        action: 'match.confirmReturn',
        entity: 'match',
        entityId: match.snapshot.id,
      }),
    );

    return toMatchDTO(match);
  }
}
