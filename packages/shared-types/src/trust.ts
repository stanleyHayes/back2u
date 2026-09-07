/**
 * Community standing (spec §16). Reaching a level needs BOTH a high enough
 * Trust Score and a real track record, so neither a spotless brand-new account
 * nor a high-volume farmer can climb on one dimension alone.
 */
export type TrustLevel =
  'new_finder' | 'helper' | 'trusted_finder' | 'community_hero' | 'guardian' | 'legend';

export const TRUST_LEVELS: readonly TrustLevel[] = [
  'new_finder',
  'helper',
  'trusted_finder',
  'community_hero',
  'guardian',
  'legend',
];

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  new_finder: 'New Finder',
  helper: 'Helper',
  trusted_finder: 'Trusted Finder',
  community_hero: 'Community Hero',
  guardian: 'Guardian',
  legend: 'Bak2Me Legend',
};

/** The six inputs the specification names for a Trust Score. */
export type TrustComponentKey =
  | 'identity_confidence'
  | 'recovery_history'
  | 'verification_quality'
  | 'account_integrity'
  | 'community_history'
  | 'partner_integrity';

export interface TrustComponentDTO {
  key: TrustComponentKey;
  label: string;
  /** 0–1 before weighting. */
  value: number;
  /** Share of the final score this component could contribute. */
  weight: number;
  /** Plain-English account of what drove the value. */
  detail: string;
}

export interface TrustScoreDTO {
  userId: string;
  /** 0–100. Reliability, deliberately not a tally of activity. */
  score: number;
  level: TrustLevel;
  /** The level above this one, and what is still missing to reach it. */
  nextLevel?: TrustLevel;
  nextLevelRequirement?: string;
  components: TrustComponentDTO[];
  computedAt: string;
}

/** What a viewer other than the owner or an admin may see. */
export interface PublicTrustDTO {
  userId: string;
  level: TrustLevel;
  score: number;
}
