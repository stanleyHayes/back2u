import type { PlaceRef } from './geo.js';
import type { SubscriptionTier } from './billing.js';

export type InstitutionType =
  | 'school'
  | 'airport'
  | 'transport'
  | 'event'
  | 'mall'
  | 'restaurant'
  | 'cafe'
  | 'retail'
  | 'pharmacy'
  | 'hotel'
  | 'other';

export interface InstitutionDTO {
  id: string;
  name: string;
  type: InstitutionType;
  contactEmail: string;
  place: PlaceRef;
  pointsRedeemable: boolean;
  pointToCurrencyRate?: number;
  subscriptionTier?: SubscriptionTier;
  subscriptionRenewsAt?: string;
  createdAt: string;
  /** Rewards directory ("advertise me") opt-in + storefront branding. */
  rewardsListed?: boolean;
  logoUrl?: string;
  description?: string;
  website?: string;
}

/** Partner self-serve update of their rewards storefront / directory listing. */
export interface UpdateRewardsProfileInput {
  rewardsListed?: boolean;
  pointsRedeemable?: boolean;
  pointToCurrencyRate?: number;
  type?: InstitutionType;
  logoUrl?: string;
  description?: string;
  website?: string;
}

/** Self-serve "partner with us" lead, captured publicly and reviewed by admins. */
export type InstitutionLeadStatus = 'new' | 'contacted' | 'approved' | 'rejected';

export interface SubmitInstitutionLeadInput {
  name: string;
  type?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city: string;
  estimatedVolume?: string;
  message?: string;
}

export interface InstitutionLeadDTO {
  id: string;
  name: string;
  type?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city: string;
  estimatedVolume?: string;
  message?: string;
  status: InstitutionLeadStatus;
  createdAt: string;
}
