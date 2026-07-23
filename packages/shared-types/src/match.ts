import type { MatchStatus } from './enums.js';

export interface MatchDTO {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number; // 0..1
  imageScore: number;
  textScore: number;
  geoScore: number;
  timeScore: number;
  status: MatchStatus;
  returnConfirmedByLost?: string;
  returnConfirmedByFound?: string;
  returnedAt?: string;
  createdAt: string;
}
