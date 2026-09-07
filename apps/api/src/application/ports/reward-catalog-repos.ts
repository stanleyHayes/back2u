import type { RewardOfferStatus } from '@back2u/shared-types';

import type { RewardOffer } from '../../domain/reward_catalog/reward-offer.entity.js';
import type { Id } from '../../domain/shared/id.js';

export interface IRewardOfferRepository {
  save(o: RewardOffer): Promise<void>;
  findById(id: Id): Promise<RewardOffer | null>;
  listForInstitution(institutionId: Id): Promise<RewardOffer[]>;
  /** The member-facing catalogue: live offers inside their campaign window. */
  listLive(
    now: Date,
    opts: { limit: number; skip: number; institutionId?: Id },
  ): Promise<{ offers: RewardOffer[]; total: number }>;
  countByStatus(institutionId: Id): Promise<Record<RewardOfferStatus, number>>;
  /**
   * Atomically takes one unit of stock, returning false when none is left.
   *
   * The availability check in the use case is a read-then-write; without this
   * conditional decrement two members reserving the last unit at once would
   * both succeed and the partner would owe a reward they never funded.
   * Unlimited offers always succeed.
   */
  tryReserveStock(offerId: Id): Promise<boolean>;
  /** Returns a unit to stock after an expiry, cancellation or reversal. */
  restoreStock(offerId: Id): Promise<void>;
}
