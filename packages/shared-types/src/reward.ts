import type { RewardStatus } from './enums.js';

export interface RewardDTO {
  id: string;
  itemId: string;
  amount: number;
  currency: string;
  pointsBonus: number;
  status: RewardStatus;
  finderId?: string;
  releasedAt?: string;
  commissionAmount?: number;
  createdAt: string;
}
