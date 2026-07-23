import type { VerificationStatus } from './enums.js';

export interface VerificationQuestion {
  id: string;
  prompt: string;
}

export interface VerificationProof {
  kind: 'receipt' | 'imei' | 'serial' | 'old_photo' | 'other';
  url?: string;
  text?: string;
}

export interface OwnershipVerificationDTO {
  id: string;
  itemId: string;
  claimantId: string;
  answers: { questionId: string; answer: string }[];
  proofs: VerificationProof[];
  aiConsistencyScore: number;
  status: VerificationStatus;
  reviewerId?: string;
  reviewerNote?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface SubmitVerificationInput {
  itemId: string;
  answers: { questionId: string; answer: string }[];
  proofs: VerificationProof[];
}
