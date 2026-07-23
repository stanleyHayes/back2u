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
}
