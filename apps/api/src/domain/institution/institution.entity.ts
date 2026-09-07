import {
  CUSTODY_TIERS,
  type InstitutionType,
  type PartnerTier,
  type PartnerTrustStatus,
  type PlaceRef,
  type SubscriptionTier,
  type UpdateRewardsProfileInput,
} from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';

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
  /** What the partner is for (spec §11); decides custody permissions. */
  tier?: PartnerTier;
  /** Partner standing (spec §12). Absent is treated as `active`. */
  trustStatus?: PartnerTrustStatus;
  trustStatusNote?: string;
  trustStatusChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Ordered by severity so an automated downgrade never silently upgrades. */
const TRUST_SEVERITY: Record<PartnerTrustStatus, number> = {
  active: 0,
  watchlist: 1,
  reward_hold: 2,
  suspended: 3,
};

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
  get tier(): PartnerTier {
    // Partners onboarded before tiers existed are plain community partners.
    return this.state.tier ?? 'community';
  }

  get trustStatus(): PartnerTrustStatus {
    return this.state.trustStatus ?? 'active';
  }

  /** True if this partner's tier permits it to take physical custody (§11). */
  get canHoldCustody(): boolean {
    return CUSTODY_TIERS.includes(this.tier);
  }

  /** True if the partner may currently accept deposits and release items (§12). */
  get canOperateCustody(): boolean {
    return this.canHoldCustody && this.trustStatus !== 'suspended';
  }

  /** True if BakPoints earned through this partner must be held back (§12). */
  get rewardsAreHeld(): boolean {
    const status = this.trustStatus;
    return status === 'reward_hold' || status === 'suspended';
  }

  setTier(tier: PartnerTier): void {
    this.state.tier = tier;
    this.state.updatedAt = new Date();
  }

  /**
   * Moves the partner along the §12 progression. Automated escalation may only
   * increase severity; returning a partner to a lighter status is an explicit
   * admin decision, so it requires `byAdmin`.
   */
  setTrustStatus(next: PartnerTrustStatus, opts: { note?: string; byAdmin?: boolean } = {}): void {
    const current = this.trustStatus;
    if (next === current) return;
    if (TRUST_SEVERITY[next] < TRUST_SEVERITY[current] && !opts.byAdmin) {
      throw new ConflictError(`Only an admin can move a partner from ${current} back to ${next}`);
    }
    this.state.trustStatus = next;
    this.state.trustStatusNote = opts.note;
    this.state.trustStatusChangedAt = new Date();
    this.state.updatedAt = this.state.trustStatusChangedAt;
  }

  updateRewardsProfile(input: UpdateRewardsProfileInput): void {
    if (input.rewardsListed !== undefined) this.state.rewardsListed = input.rewardsListed;
    if (input.pointsRedeemable !== undefined) this.state.pointsRedeemable = input.pointsRedeemable;
    if (input.pointToCurrencyRate !== undefined)
      this.state.pointToCurrencyRate = input.pointToCurrencyRate;
    if (input.type !== undefined) this.state.type = input.type;
    if (input.logoUrl !== undefined) this.state.logoUrl = input.logoUrl || undefined;
    if (input.description !== undefined) this.state.description = input.description || undefined;
    if (input.website !== undefined) this.state.website = input.website || undefined;
    this.state.updatedAt = new Date();
  }
}
