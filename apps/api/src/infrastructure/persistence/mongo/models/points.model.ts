import { Schema, model } from 'mongoose';

import type { PointLedgerEntrySnapshot } from '../../../../domain/points/point-ledger-entry.entity.js';
import type { RiskAssessmentSnapshot } from '../../../../domain/risk/risk-assessment.entity.js';
import type { BusinessRulesSnapshot } from '../../../../domain/rules/business-rules.entity.js';

export type PointLedgerEntryDoc = Omit<PointLedgerEntrySnapshot, 'id'> & { _id: string };

const reasonSchema = new Schema(
  { code: { type: String, required: true }, detail: { type: String, required: true } },
  { _id: false },
);

const pointLedgerSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    points: { type: Number, required: true },
    basePoints: { type: Number, required: true },
    multiplier: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'reversed', 'cancelled'],
      required: true,
    },
    verificationLevel: {
      type: String,
      enum: ['peer', 'recovery_point', 'verified_delivery', 'institutional'],
    },
    caseRef: { type: String },
    itemId: { type: String },
    counterpartyId: { type: String },
    reasons: { type: [reasonSchema], default: [] },
    pendingUntil: { type: Date },
    clearedAt: { type: Date },
    creditedAt: { type: Date },
    reversedAt: { type: Date },
    resolutionNote: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// A user's own ledger page, newest first.
pointLedgerSchema.index({ userId: 1, createdAt: -1 });
// The clearing job scans due pending entries, plus any entry that was cleared
// but whose balance credit never landed (the repair path).
pointLedgerSchema.index({ status: 1, pendingUntil: 1 });
pointLedgerSchema.index({ status: 1, creditedAt: 1 });
// Repeat-pair detection and per-case lookups.
pointLedgerSchema.index({ userId: 1, counterpartyId: 1, action: 1 });
pointLedgerSchema.index({ caseRef: 1 });
// `existsForCase` is a read-then-write, so concurrent confirmations of the same
// recovery could both pass it and double-credit. This partial unique index is
// the real guard; AwardPointsUseCase treats its violation as "already credited".
pointLedgerSchema.index(
  { userId: 1, caseRef: 1, action: 1 },
  { unique: true, partialFilterExpression: { caseRef: { $exists: true } } },
);

export const PointLedgerEntryModel = model<PointLedgerEntryDoc>(
  'PointLedgerEntry',
  pointLedgerSchema,
);

export type RiskAssessmentDoc = Omit<RiskAssessmentSnapshot, 'id'> & { _id: string };

const ruleHitSchema = new Schema(
  {
    code: { type: String, required: true },
    weight: { type: Number, required: true },
    detail: { type: String, required: true },
  },
  { _id: false },
);

const riskAssessmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    subjectId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    finderId: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    band: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    action: {
      type: String,
      enum: ['clear', 'extend_hold', 'manual_review', 'freeze'],
      required: true,
    },
    ruleHits: { type: [ruleHitSchema], default: [] },
    reviewStatus: {
      type: String,
      enum: ['open', 'cleared', 'confirmed_fraud', 'dismissed'],
      required: true,
    },
    reviewerId: { type: String },
    reviewerNote: { type: String },
    createdAt: { type: Date, required: true },
    decidedAt: { type: Date },
  },
  { versionKey: false },
);

// The Trust & Safety queue: open cases, riskiest first.
riskAssessmentSchema.index({ reviewStatus: 1, score: -1, createdAt: -1 });

export const RiskAssessmentModel = model<RiskAssessmentDoc>('RiskAssessment', riskAssessmentSchema);

export type BusinessRulesDoc = Omit<BusinessRulesSnapshot, 'id'> & { _id: string };

const businessRulesSchema = new Schema(
  {
    _id: { type: String, required: true },
    pointsPerAction: { type: Schema.Types.Mixed, required: true },
    categoryBonus: { type: Schema.Types.Mixed, default: {} },
    pointsPendingDays: { type: Number, required: true },
    riskExtendedPendingDays: { type: Number, required: true },
    dailyPointCap: { type: Number, required: true },
    weeklyPointCap: { type: Number, required: true },
    monthlyPointCap: { type: Number, required: true },
    verificationMultipliers: { type: Schema.Types.Mixed, required: true },
    repeatPairFreeCount: { type: Number, required: true },
    repeatPairPenalty: { type: Number, required: true },
    diminishingReturnsAfter: { type: Number, required: true },
    diminishingReturnsFactor: { type: Number, required: true },
    newAccountMinAgeDays: { type: Number, required: true },
    newAccountRewardDelayDays: { type: Number, required: true },
    highValueThresholdMinor: { type: Number, required: true },
    riskThresholds: { type: Schema.Types.Mixed, required: true },
    rewardPlatformFeeRate: { type: Number, required: true },
    campaignMultiplier: { type: Number, required: true },
    campaignStartsAt: { type: Date },
    campaignEndsAt: { type: Date },
    updatedAt: { type: Date, required: true },
    updatedBy: { type: String },
  },
  { versionKey: false, minimize: false },
);

export const BusinessRulesModel = model<BusinessRulesDoc>('BusinessRules', businessRulesSchema);
