import type { CustodyRecordDTO, CustodyStatus, ItemCondition } from '@back2u/shared-types';

import { hashOtpCode } from '../auth/otp.entity.js';
import { ConflictError, ForbiddenError, ValidationError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

/** A release code is read out at a counter, so it expires quickly. */
export const RELEASE_CODE_TTL_MS = 30 * 60 * 1000;
/** Online guessing budget against a short code before it is burned. */
export const MAX_RELEASE_ATTEMPTS = 5;

export interface CustodyRecordSnapshot {
  id: Id;
  caseId: Id;
  itemId: Id;
  institutionId: Id;
  locationId: Id;
  depositedByUserId: Id;
  /**
   * The USER id of the staff member who accepted the item — not their
   * PartnerStaff membership id. Separation of duties compares people, so this
   * has to be directly comparable to `depositedByUserId`. The membership id is
   * recorded separately on the CUSTODY_ACCEPTED event as `actorStaffId`.
   */
  acceptedByStaffId: Id;
  condition: ItemCondition;
  declaredContents: string[];
  sealId: string;
  storageBin?: string;
  intakePhotos: string[];
  status: CustodyStatus;
  receiptCode: string;
  /** Peppered HMAC of the live release code. Never the code itself. */
  releaseCodeHash?: string;
  /** The claimant the live code was issued to; only they can collect with it. */
  releaseCodeClaimantId?: Id;
  releaseCodeExpiresAt?: Date;
  releaseAttempts: number;
  releasedToUserId?: Id;
  /** The USER id of the releasing staff member; see `acceptedByStaffId`. */
  releasedByStaffId?: Id;
  releasedAt?: Date;
  releaseNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An item physically held at a Recovery Point (spec §10).
 *
 * The release code follows `CourierJob`'s shape — compared inside the entity,
 * `ForbiddenError` on mismatch — but not its storage: courier codes are kept in
 * plaintext with no expiry and no attempt cap, which is not good enough to
 * authorise handing over someone's property. The code is peppered-hashed at
 * rest, expires, and burns after {@link MAX_RELEASE_ATTEMPTS} wrong guesses.
 */
export class CustodyRecord {
  private constructor(private state: CustodyRecordSnapshot) {}

  static rehydrate(s: CustodyRecordSnapshot): CustodyRecord {
    return new CustodyRecord({ ...s });
  }

  static accept(input: {
    id: Id;
    caseId: Id;
    itemId: Id;
    institutionId: Id;
    locationId: Id;
    depositedByUserId: Id;
    acceptedByStaffId: Id;
    condition: ItemCondition;
    declaredContents?: string[];
    sealId: string;
    storageBin?: string;
    intakePhotos?: string[];
    receiptCode: string;
  }): CustodyRecord {
    // §12: a staff member must not be able to launder their own find through
    // the partner desk to earn the stronger verification multiplier.
    if (input.depositedByUserId === input.acceptedByStaffId) {
      throw new ForbiddenError('Staff cannot accept custody of their own deposit');
    }
    const now = new Date();
    return new CustodyRecord({
      ...input,
      declaredContents: input.declaredContents ?? [],
      intakePhotos: input.intakePhotos ?? [],
      status: 'held',
      releaseAttempts: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get status(): CustodyStatus {
    return this.state.status;
  }
  get snapshot(): CustodyRecordSnapshot {
    return {
      ...this.state,
      declaredContents: [...this.state.declaredContents],
      intakePhotos: [...this.state.intakePhotos],
    };
  }

  /** Stores the hash of a freshly issued release code, bound to its claimant. */
  issueReleaseCode(code: string, claimantId: Id, now = new Date()): void {
    if (this.state.status !== 'held') {
      throw new ConflictError(`Item is not in custody (status=${this.state.status})`);
    }
    this.state.releaseCodeHash = hashOtpCode(code);
    this.state.releaseCodeClaimantId = claimantId;
    this.state.releaseCodeExpiresAt = new Date(now.getTime() + RELEASE_CODE_TTL_MS);
    this.state.releaseAttempts = 0;
    this.state.updatedAt = now;
  }

  /**
   * Hands the item to a verified claimant. The caller is responsible for having
   * already checked that ownership is proven and that the acting staff member
   * is authorised for this location.
   */
  release(input: {
    code: string;
    claimantId: Id;
    releasedByStaffId: Id;
    note?: string;
    now?: Date;
  }): void {
    const now = input.now ?? new Date();
    if (this.state.status !== 'held') {
      throw new ConflictError(`Item is not in custody (status=${this.state.status})`);
    }
    if (!this.state.releaseCodeHash || !this.state.releaseCodeExpiresAt) {
      throw new ConflictError('No release code has been issued for this item');
    }
    if (this.state.releaseCodeExpiresAt < now) {
      throw new ForbiddenError('Release code has expired');
    }
    if (this.state.releaseAttempts >= MAX_RELEASE_ATTEMPTS) {
      throw new ForbiddenError('Too many failed release attempts; issue a new code');
    }
    // The code proves that this specific claimant is at the counter. Accepting
    // it for anyone else would let a code issued to one verified claimant
    // authorise a handover recorded against a different person.
    if (this.state.releaseCodeClaimantId !== input.claimantId) {
      throw new ForbiddenError('That release code was issued to a different claimant');
    }
    // §12: separation of duties — the desk cannot release an item to itself.
    if (input.claimantId === input.releasedByStaffId) {
      throw new ForbiddenError('Staff cannot release an item to themselves');
    }

    this.state.releaseAttempts += 1;
    if (this.state.releaseCodeHash !== hashOtpCode(input.code)) {
      this.state.updatedAt = now;
      throw new ForbiddenError('Invalid release code');
    }

    this.state.status = 'released';
    this.state.releasedToUserId = input.claimantId;
    this.state.releasedByStaffId = input.releasedByStaffId;
    this.state.releasedAt = now;
    this.state.releaseNote = input.note;
    // Burn the code so a replay cannot re-release a transferred item.
    this.state.releaseCodeHash = undefined;
    this.state.releaseCodeClaimantId = undefined;
    this.state.releaseCodeExpiresAt = undefined;
    this.state.updatedAt = now;
  }

  /** Moves the item to another location without ending custody. */
  transferTo(locationId: Id): void {
    if (this.state.status !== 'held') {
      throw new ConflictError(`Item is not in custody (status=${this.state.status})`);
    }
    if (locationId === this.state.locationId) {
      throw new ValidationError('Item is already at that location');
    }
    this.state.locationId = locationId;
    this.state.storageBin = undefined;
    this.state.updatedAt = new Date();
  }

  updateStorageBin(bin: string): void {
    if (this.state.status !== 'held') {
      throw new ConflictError(`Item is not in custody (status=${this.state.status})`);
    }
    this.state.storageBin = bin;
    this.state.updatedAt = new Date();
  }
}

/**
 * The partner-facing view. `storageBin` is included because only partner staff
 * and admins ever receive this DTO; it must not reach a public surface.
 */
export function toCustodyRecordDTO(r: CustodyRecord): CustodyRecordDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    caseId: s.caseId,
    itemId: s.itemId,
    institutionId: s.institutionId,
    locationId: s.locationId,
    depositedByUserId: s.depositedByUserId,
    acceptedByStaffId: s.acceptedByStaffId,
    condition: s.condition,
    declaredContents: s.declaredContents,
    sealId: s.sealId,
    storageBin: s.storageBin,
    intakePhotos: s.intakePhotos,
    status: s.status,
    receiptCode: s.receiptCode,
    releasedToUserId: s.releasedToUserId,
    releasedByStaffId: s.releasedByStaffId,
    releasedAt: s.releasedAt?.toISOString(),
    releaseNote: s.releaseNote,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
