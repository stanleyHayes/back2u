import type { PointsRedemption } from '../../domain/redemption/redemption.entity.js';
import type { Id } from '../../domain/shared/id.js';

export interface IRedemptionRepository {
  save(r: PointsRedemption): Promise<void>;
  findById(id: Id): Promise<PointsRedemption | null>;
  findByCode(code: string): Promise<PointsRedemption | null>;
  listForUser(userId: Id, limit?: number): Promise<PointsRedemption[]>;
  listForInstitution(institutionId: Id, limit?: number): Promise<PointsRedemption[]>;
  countByInstitution(institutionId: Id): Promise<{ count: number; totalPoints: number }>;
  listRecentByInstitution(institutionId: Id, limit: number): Promise<PointsRedemption[]>;
  /** How many of one offer a member currently holds or has already redeemed. */
  countForUserAndOffer(userId: Id, offerId: Id): Promise<number>;
  /** Reservations whose hold has lapsed, for the expiry sweep. */
  findDueReservations(now: Date, limit: number): Promise<PointsRedemption[]>;
  /** Redemption counts per status for one offer, for partner analytics. */
  statsForOffer(offerId: Id): Promise<Record<string, { count: number; points: number }>>;
}
