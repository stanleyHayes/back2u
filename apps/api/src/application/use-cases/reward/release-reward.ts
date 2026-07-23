import type { RewardDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import type { Reward } from '../../../domain/reward/reward.entity.js';
import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IAuditLogRepository,
  IItemRepository,
  INotificationRepository,
  IRewardRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { ILogger, IPaymentEscrowService, IPushService, IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import type { Env } from '../../../config/env.js';

export function toRewardDTO(r: Reward): RewardDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    amount: s.amount,
    currency: s.currency,
    pointsBonus: s.pointsBonus,
    status: s.status,
    finderId: s.finderId,
    releasedAt: s.releasedAt?.toISOString(),
    commissionAmount: s.commissionAmount,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class ReleaseRewardUseCase {
  constructor(
    @inject(TOKENS.RewardRepository) private readonly rewards: IRewardRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.PaymentEscrow) private readonly escrow: IPaymentEscrowService,
    @inject(TOKENS.PushService) private readonly push: IPushService,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.Env) private readonly env: Env,
  ) {}

  async execute(rewardId: Id, actorId: Id, finderId: Id): Promise<RewardDTO> {
    const reward = await this.rewards.findById(rewardId);
    if (!reward) throw new NotFoundError('Reward');
    const item = await this.items.findById(reward.snapshot.itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.postedById !== actorId) {
      throw new ForbiddenError('Only the item owner can release the reward');
    }
    const finder = await this.users.findById(finderId);
    if (!finder) throw new NotFoundError('Finder');

    reward.release(finderId, this.env.PLATFORM_COMMISSION_RATE);
    await this.rewards.save(reward);

    try {
      await this.escrow.release({
        providerRef: reward.snapshot.id,
        recipientPhone: finder.snapshot.phone ?? '',
      });
    } catch (err) {
      this.logger.warn('escrow release failed', { rewardId, err: String(err) });
    }

    finder.awardPoints(reward.snapshot.pointsBonus, 10);
    finder.recordSuccessfulReturn();
    await this.users.save(finder);

    const title = 'Reward released';
    const body = `The reward for "${item.snapshot.title}" has been released to you.`;
    const data = { rewardId: reward.snapshot.id, itemId: item.id, amount: reward.snapshot.amount };
    await this.notifications.save(
      Notification.create({ id: newId(), userId: finderId, type: 'system', title, body, data }),
    );
    this.bus.publishToUser(finderId, 'reward:released', data);
    if (finder.snapshot.pushTokens.length > 0) {
      void this.push.send(finder.snapshot.pushTokens, title, body, data).catch(() => {});
    }

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'reward.release',
        entity: 'reward',
        entityId: reward.snapshot.id,
        meta: {
          finderId,
          amount: reward.snapshot.amount,
          commissionAmount: reward.snapshot.commissionAmount,
        },
      }),
    );

    return toRewardDTO(reward);
  }
}
