export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionPlanDTO {
  tier: SubscriptionTier;
  name: string;
  /** Per-month price in minor units (e.g. pesewas). 0 = free. */
  priceMinor: number;
  currency: string;
  tagline: string;
  features: string[];
}

/** Static catalogue of institution subscription plans. */
export const SUBSCRIPTION_PLANS: SubscriptionPlanDTO[] = [
  {
    tier: 'free',
    name: 'Starter',
    priceMinor: 0,
    currency: 'GHS',
    tagline: 'For small venues getting started.',
    features: ['Lost & found tracking', 'Up to 100 items / month', 'Points redemption at one counter', 'Community support'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    priceMinor: 50_000,
    currency: 'GHS',
    tagline: 'For busy malls, campuses & hotels.',
    features: [
      'Everything in Starter',
      'Unlimited items',
      'Bulk QR-tag minting',
      'Courier dispatch board',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    priceMinor: 200_000,
    currency: 'GHS',
    tagline: 'For airports, transit & multi-branch networks.',
    features: [
      'Everything in Pro',
      'Multi-branch management',
      'API access & webhooks',
      'Custom point→cash rates',
      'Dedicated success manager',
      'Uptime SLA',
    ],
  },
];

export interface SubscribeInstitutionInput {
  tier: SubscriptionTier;
}
