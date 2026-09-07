import type { CustodyStatus, RecoveryCaseStatus } from '@back2u/shared-types';

import type { CustodyRecord } from '../../domain/custody/custody-record.entity.js';
import type { PartnerLocation } from '../../domain/custody/partner-location.entity.js';
import type { PartnerStaff } from '../../domain/custody/partner-staff.entity.js';
import type { RecoveryCase } from '../../domain/recovery/recovery-case.entity.js';
import type { RecoveryEvent } from '../../domain/recovery/recovery-event.entity.js';
import type { Id } from '../../domain/shared/id.js';

export interface IPartnerLocationRepository {
  save(l: PartnerLocation): Promise<void>;
  findById(id: Id): Promise<PartnerLocation | null>;
  listForInstitution(institutionId: Id): Promise<PartnerLocation[]>;
  countForInstitution(institutionId: Id): Promise<number>;
}

export interface IPartnerStaffRepository {
  save(s: PartnerStaff): Promise<void>;
  findById(id: Id): Promise<PartnerStaff | null>;
  /** The acting membership for a user at an organisation, if any. */
  findMembership(userId: Id, institutionId: Id): Promise<PartnerStaff | null>;
  listForUser(userId: Id): Promise<PartnerStaff[]>;
  listForInstitution(institutionId: Id): Promise<PartnerStaff[]>;
  countForInstitution(institutionId: Id): Promise<number>;
}

export interface ICustodyRecordRepository {
  save(r: CustodyRecord): Promise<void>;
  findById(id: Id): Promise<CustodyRecord | null>;
  /** The live custody record for an item, if a partner currently holds it. */
  findActiveForItem(itemId: Id): Promise<CustodyRecord | null>;
  /** Every custody record for an item, including released ones. */
  listForItem(itemId: Id): Promise<CustodyRecord[]>;
  findByCaseId(caseId: Id): Promise<CustodyRecord | null>;
  listForLocation(
    locationId: Id,
    opts: { status?: CustodyStatus; limit: number; skip: number },
  ): Promise<{ records: CustodyRecord[]; total: number }>;
  countForInstitution(
    institutionId: Id,
  ): Promise<{ deposits: number; releases: number; open: number }>;
  /**
   * How many of this finder's deposits ran through each institution — the
   * partner-concentration signal reserved in the risk engine (spec §6).
   */
  countDepositsByInstitutionForUser(userId: Id, since: Date): Promise<Record<Id, number>>;
}

export interface IRecoveryCaseRepository {
  save(c: RecoveryCase): Promise<void>;
  findById(id: Id): Promise<RecoveryCase | null>;
  findByReference(reference: string): Promise<RecoveryCase | null>;
  findByFoundItemId(itemId: Id): Promise<RecoveryCase | null>;
  findByMatchId(matchId: Id): Promise<RecoveryCase | null>;
  listForInstitution(
    institutionId: Id,
    opts: { status?: RecoveryCaseStatus; limit: number; skip: number },
  ): Promise<{ cases: RecoveryCase[]; total: number }>;
  listForUser(userId: Id, limit: number): Promise<RecoveryCase[]>;
}

export interface IRecoveryEventRepository {
  /**
   * Insert-only. Implementations must NOT upsert: spec §12 forbids destructive
   * edits to custody history, and the house `replaceOne` convention would let a
   * repeated id silently overwrite a link in the chain.
   */
  append(e: RecoveryEvent): Promise<void>;
  listForCase(caseId: Id): Promise<RecoveryEvent[]>;
  findById(id: Id): Promise<RecoveryEvent | null>;
}
