import { Schema, model } from 'mongoose';

import type { CustodyRecordSnapshot } from '../../../../domain/custody/custody-record.entity.js';
import type { PartnerLocationSnapshot } from '../../../../domain/custody/partner-location.entity.js';
import type { PartnerStaffSnapshot } from '../../../../domain/custody/partner-staff.entity.js';
import type { RecoveryCaseSnapshot } from '../../../../domain/recovery/recovery-case.entity.js';
import type { RecoveryEventSnapshot } from '../../../../domain/recovery/recovery-event.entity.js';

const placeSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    point: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  { _id: false },
);

export type PartnerLocationDoc = Omit<PartnerLocationSnapshot, 'id'> & { _id: string };

const partnerLocationSchema = new Schema(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    place: { type: placeSchema, required: true },
    storageDescription: { type: String },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
// Nearest-Recovery-Point lookups.
partnerLocationSchema.index({ 'place.point': '2dsphere' });

export const PartnerLocationModel = model<PartnerLocationDoc>(
  'PartnerLocation',
  partnerLocationSchema,
);

export type PartnerStaffDoc = Omit<PartnerStaffSnapshot, 'id'> & { _id: string };

const partnerStaffSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    locationId: { type: String },
    role: { type: String, enum: ['agent', 'supervisor', 'manager'], required: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
// One membership per person per organisation.
partnerStaffSchema.index({ userId: 1, institutionId: 1 }, { unique: true });

export const PartnerStaffModel = model<PartnerStaffDoc>('PartnerStaff', partnerStaffSchema);

export type CustodyRecordDoc = Omit<CustodyRecordSnapshot, 'id'> & { _id: string };

const custodyRecordSchema = new Schema(
  {
    _id: { type: String, required: true },
    caseId: { type: String, required: true, index: true },
    itemId: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    locationId: { type: String, required: true },
    depositedByUserId: { type: String, required: true, index: true },
    acceptedByStaffId: { type: String, required: true },
    condition: { type: String, enum: ['new', 'good', 'fair', 'poor', 'damaged'], required: true },
    declaredContents: { type: [String], default: [] },
    sealId: { type: String, required: true },
    storageBin: { type: String },
    intakePhotos: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['held', 'released', 'transferred', 'disposed'],
      required: true,
    },
    receiptCode: { type: String, required: true, unique: true },
    releaseCodeHash: { type: String },
    releaseCodeClaimantId: { type: String },
    releaseCodeExpiresAt: { type: Date },
    releaseAttempts: { type: Number, required: true, default: 0 },
    releasedToUserId: { type: String },
    releasedByStaffId: { type: String },
    releasedAt: { type: Date },
    releaseNote: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
// The live-custody lookup for an item, and the per-counter shelf list.
custodyRecordSchema.index({ itemId: 1, status: 1 });
// One item can be physically held in exactly one place. The application check
// is a read-then-write, so this partial unique index is what actually stops two
// concurrent deposits creating two `held` records for the same item.
custodyRecordSchema.index(
  { itemId: 1 },
  { unique: true, partialFilterExpression: { status: 'held' } },
);
// The archive job sweeps every held record; without this it is a collection scan.
custodyRecordSchema.index({ status: 1 });
custodyRecordSchema.index({ locationId: 1, status: 1, createdAt: -1 });

export const CustodyRecordModel = model<CustodyRecordDoc>('CustodyRecord', custodyRecordSchema);

export type RecoveryCaseDoc = Omit<RecoveryCaseSnapshot, 'id'> & { _id: string };

const recoveryCaseSchema = new Schema(
  {
    _id: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    foundItemId: { type: String, required: true, unique: true },
    lostItemId: { type: String },
    matchId: { type: String, index: true },
    finderId: { type: String, required: true, index: true },
    claimantId: { type: String, index: true },
    status: { type: String, required: true },
    verificationLevel: { type: String, required: true },
    custodyRecordId: { type: String },
    institutionId: { type: String },
    locationId: { type: String },
    lastSequence: { type: Number, required: true, default: 0 },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
// The partner console's case queue.
recoveryCaseSchema.index({ institutionId: 1, status: 1, openedAt: -1 });

export const RecoveryCaseModel = model<RecoveryCaseDoc>('RecoveryCase', recoveryCaseSchema);

export type RecoveryEventDoc = Omit<RecoveryEventSnapshot, 'id'> & { _id: string };

const recoveryEventSchema = new Schema(
  {
    _id: { type: String, required: true },
    caseId: { type: String, required: true },
    sequence: { type: Number, required: true },
    kind: { type: String, required: true },
    actorId: { type: String },
    actorStaffId: { type: String },
    institutionId: { type: String, index: true },
    locationId: { type: String },
    evidence: { type: Schema.Types.Mixed, default: {} },
    note: { type: String },
    correctsEventId: { type: String },
    occurredAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);
// The chain of custody is read in order, and the unique constraint is what
// makes the sequence a real chain: two writers cannot claim the same link.
recoveryEventSchema.index({ caseId: 1, sequence: 1 }, { unique: true });

export const RecoveryEventModel = model<RecoveryEventDoc>('RecoveryEvent', recoveryEventSchema);
