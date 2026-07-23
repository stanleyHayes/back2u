export interface LeaderboardEntryDTO {
  userId: string;
  name: string;
  avatarUrl?: string;
  pointsBalance: number;
  reputationScore: number;
  successfulReturns: number;
  rank: number;
  badges: string[];
}
