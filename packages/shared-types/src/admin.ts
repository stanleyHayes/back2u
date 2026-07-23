import type { ItemDTO } from './item.js';
import type { RedemptionDTO } from './redemption.js';

export interface AdminStatsDTO {
  users: number;
  itemsByStatus: Record<string, number>;
  itemsByKind: Record<string, number>;
  itemsByCategory: Record<string, number>;
  itemsTotal: number;
  marketplaceListings: number;
  marketplaceBids: number;
  institutions: number;
  courierJobs: number;
  matchesTotal: number;
  matchesAccepted: number;
  matchSuccessRate: number;
  usersPerDay: number[];
  itemsPerDay: number[];
  matchesPerDay: number[];
}

export interface PartnerStatsDTO {
  totalItems: number;
  openItems: number;
  matchedItems: number;
  returnedItems: number;
  itemsByStatus: Record<string, number>;
  totalRedemptions: number;
  totalPointsRedeemed: number;
  totalCourierJobs: number;
  activeCourierJobs: number;
  recentItems: ItemDTO[];
  recentRedemptions: RedemptionDTO[];
}
