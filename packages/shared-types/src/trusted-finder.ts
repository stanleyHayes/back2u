export type TrustedFinderApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface TrustedFinderApplicationDTO {
  id: string;
  userId: string;
  status: TrustedFinderApplicationStatus;
  reason?: string;
  idPhotoUrl: string;
  bio?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface ApplyTrustedFinderInput {
  idPhotoUrl: string;
  bio?: string;
}
