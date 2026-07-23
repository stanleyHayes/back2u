import type { InstitutionType, PlaceRef, SubscriptionTier, UpdateRewardsProfileInput } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface InstitutionSnapshot {
  id: Id;
  name: string;
  type: InstitutionType;
  contactEmail: string;
  place: PlaceRef;
  pointsRedeemable: boolean;
  pointToCurrencyRate?: number;
  apiKeyHash?: string;
  webhookUrl?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionRenewsAt?: Date;
  rewardsListed?: boolean;
  logoUrl?: string;
  description?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Institution {
  private constructor(private state: InstitutionSnapshot) {}
  static rehydrate(s: InstitutionSnapshot): Institution {
    return new Institution({ ...s });
  }
  static onboard(input: Omit<InstitutionSnapshot, 'createdAt' | 'updatedAt'>): Institution {
    const now = new Date();
    return new Institution({ ...input, createdAt: now, updatedAt: now });
  }
  get snapshot(): InstitutionSnapshot {
    return { ...this.state };
  }
  setApiKeyHash(hash: string): void {
    this.state.apiKeyHash = hash;
    this.state.updatedAt = new Date();
  }
  setSubscription(tier: SubscriptionTier, renewsAt?: Date): void {
    this.state.subscriptionTier = tier;
    this.state.subscriptionRenewsAt = tier === 'free' ? undefined : renewsAt;
    this.state.updatedAt = new Date();
  }
  updateRewardsProfile(input: UpdateRewardsProfileInput): void {
    if (input.rewardsListed !== undefined) this.state.rewardsListed = input.rewardsListed;
    if (input.pointsRedeemable !== undefined) this.state.pointsRedeemable = input.pointsRedeemable;
    if (input.pointToCurrencyRate !== undefined) this.state.pointToCurrencyRate = input.pointToCurrencyRate;
    if (input.type !== undefined) this.state.type = input.type;
    if (input.logoUrl !== undefined) this.state.logoUrl = input.logoUrl || undefined;
    if (input.description !== undefined) this.state.description = input.description || undefined;
    if (input.website !== undefined) this.state.website = input.website || undefined;
    this.state.updatedAt = new Date();
  }
}
