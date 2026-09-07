import type { TrustLevel } from './trust.js';

export interface LeaderboardEntryDTO {
  userId: string;
  name: string;
  avatarUrl?: string;
  pointsBalance: number;
  /** @deprecated Mirrors `trustScore`. */
  reputationScore: number;
  /** Derived reliability, 0–100 (§16). */
  trustScore: number;
  trustLevel: TrustLevel;
  successfulReturns: number;
  rank: number;
  badges: string[];
}
