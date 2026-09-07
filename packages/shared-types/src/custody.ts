import type { PlaceRef } from './geo.js';
import type { VerificationLevel } from './enums.js';

/**
 * What a partner organisation is FOR (spec §11). Distinct from `InstitutionType`,
 * which describes the kind of venue: a university is `school` by venue type and
 * `institutional` by tier, while a corner shop is `retail` / `recovery_point`.
 * Tier decides custody permissions and the verification level a deposit earns.
 */
export type PartnerTier =
  | 'community'
  | 'recovery_point'
  | 'verified_recovery_point'
  | 'institutional'
  | 'transport'
  | 'logistics'
  | 'reward'
  | 'sponsor'
  | 'government';

export const PARTNER_TIERS: readonly PartnerTier[] = [
  'community',
  'recovery_point',
  'verified_recovery_point',
  'institutional',
  'transport',
  'logistics',
  'reward',
  'sponsor',
  'government',
];

/** Tiers permitted to take physical custody of found property. */
export const CUSTODY_TIERS: readonly PartnerTier[] = [
  'recovery_point',
  'verified_recovery_point',
  'institutional',
  'transport',
  'government',
];

/**
 * Partner standing (spec §12). Progression is one-way under automated control —
 * only an admin may return a partner to `active`.
 */
export type PartnerTrustStatus = 'active' | 'watchlist' | 'reward_hold' | 'suspended';

/** Staff seniority inside one partner organisation. Not a platform `UserRole`. */
export type PartnerStaffRole = 'agent' | 'supervisor' | 'manager';

export interface PartnerLocationDTO {
  id: string;
  institutionId: string;
  name: string;
  place: PlaceRef;
  /** Free-text description of where items are physically kept. */
  storageDescription?: string;
  active: boolean;
  createdAt: string;
}

export interface CreatePartnerLocationInput {
  name: string;
  place: PlaceRef;
  storageDescription?: string;
}

export interface PartnerStaffDTO {
  id: string;
  userId: string;
  institutionId: string;
  /** Null means the member works across every location in the organisation. */
  locationId?: string;
  role: PartnerStaffRole;
  active: boolean;
  createdAt: string;
  /** Convenience joins for the partner console. */
  userName?: string;
  userEmail?: string;
}

export interface AddPartnerStaffInput {
  userId: string;
  role: PartnerStaffRole;
  locationId?: string;
}

/** Physical condition captured at intake (spec §10). */
export type ItemCondition = 'new' | 'good' | 'fair' | 'poor' | 'damaged';

export type CustodyStatus = 'held' | 'released' | 'transferred' | 'disposed';

export interface CustodyRecordDTO {
  id: string;
  caseId: string;
  itemId: string;
  institutionId: string;
  locationId: string;
  /** The finder who handed the item in. */
  depositedByUserId: string;
  /** The staff membership that accepted it. */
  acceptedByStaffId: string;
  condition: ItemCondition;
  declaredContents: string[];
  /** Tamper-evident bag / seal identifier. */
  sealId: string;
  /** Internal shelf, bin or locker reference — never shown publicly. */
  storageBin?: string;
  intakePhotos: string[];
  status: CustodyStatus;
  /** Receipt code handed to the finder as proof of deposit. */
  receiptCode: string;
  releasedToUserId?: string;
  releasedByStaffId?: string;
  releasedAt?: string;
  releaseNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptCustodyInput {
  itemId: string;
  locationId: string;
  depositedByUserId: string;
  condition: ItemCondition;
  declaredContents?: string[];
  storageBin?: string;
  intakePhotos?: string[];
}

export interface ReleaseCustodyInput {
  /** The verified claimant collecting the item. */
  claimantId: string;
  /** The one-time code read out or scanned at the counter. */
  releaseCode: string;
  note?: string;
}

/** What the finder is shown after a deposit — the digital custody receipt. */
export interface CustodyReceiptDTO {
  caseId: string;
  custodyRecordId: string;
  itemId: string;
  receiptCode: string;
  sealId: string;
  locationName: string;
  acceptedAt: string;
}

/**
 * Recovery case states (spec §4 state machine, extended for partner custody).
 * A case is opened for every found item, whether or not a partner holds it.
 */
export type RecoveryCaseStatus =
  | 'found'
  | 'deposited'
  | 'matched'
  | 'claim_submitted'
  | 'ownership_verified'
  | 'released'
  | 'returned'
  | 'closed'
  | 'cancelled';

/** Append-only custody/recovery events (spec §9). */
export type RecoveryEventKind =
  | 'FOUND_REPORTED'
  | 'CUSTODY_ACCEPTED'
  | 'MATCH_PROPOSED'
  | 'CLAIM_SUBMITTED'
  | 'OWNERSHIP_VERIFIED'
  | 'ITEM_RELEASED'
  | 'RETURN_CONFIRMED'
  | 'REWARD_CLEARED'
  | 'CUSTODY_TRANSFERRED'
  | 'CASE_CANCELLED'
  | 'CORRECTION';

export const RECOVERY_EVENT_KINDS: readonly RecoveryEventKind[] = [
  'FOUND_REPORTED',
  'CUSTODY_ACCEPTED',
  'MATCH_PROPOSED',
  'CLAIM_SUBMITTED',
  'OWNERSHIP_VERIFIED',
  'ITEM_RELEASED',
  'RETURN_CONFIRMED',
  'REWARD_CLEARED',
  'CUSTODY_TRANSFERRED',
  'CASE_CANCELLED',
  'CORRECTION',
];

export interface RecoveryEventDTO {
  id: string;
  caseId: string;
  /** Monotonic position in this case's history, starting at 1. */
  sequence: number;
  kind: RecoveryEventKind;
  /** The user who caused the event; absent for system-generated events. */
  actorId?: string;
  /** The partner staff membership acting, when a partner did. */
  actorStaffId?: string;
  institutionId?: string;
  locationId?: string;
  /** Evidence recorded with the event — photos, codes, decisions, references. */
  evidence: Record<string, unknown>;
  note?: string;
  /** Set on a CORRECTION event: the event it supersedes. */
  correctsEventId?: string;
  occurredAt: string;
}

export interface RecoveryCaseDTO {
  id: string;
  /** Short human-quotable reference, e.g. `BAK-7Q4M2XKD`. */
  reference: string;
  foundItemId: string;
  lostItemId?: string;
  matchId?: string;
  finderId: string;
  claimantId?: string;
  status: RecoveryCaseStatus;
  verificationLevel: VerificationLevel;
  custodyRecordId?: string;
  institutionId?: string;
  locationId?: string;
  openedAt: string;
  closedAt?: string;
  updatedAt: string;
}

/** A case plus its full ordered history — the chain of custody view. */
export interface RecoveryCaseDetailDTO extends RecoveryCaseDTO {
  events: RecoveryEventDTO[];
  custody?: CustodyRecordDTO;
}

/** Deposits-to-returns and related partner health signals (spec §12). */
export interface PartnerTrustSummaryDTO {
  institutionId: string;
  tier: PartnerTier;
  trustStatus: PartnerTrustStatus;
  deposits: number;
  releases: number;
  /** releases / deposits, or null when there are no deposits yet. */
  depositsToReturnsRatio: number | null;
  openCustody: number;
  staffCount: number;
  locationCount: number;
}
