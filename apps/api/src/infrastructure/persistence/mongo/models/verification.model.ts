import { Schema, model } from 'mongoose';

import type { VerificationSnapshot } from '../../../../domain/verification/verification.entity.js';

export type VerificationDoc = Omit<VerificationSnapshot, 'id'> & { _id: string };

const answerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const proofSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ['receipt', 'imei', 'serial', 'old_photo', 'other'],
      required: true,
    },
    url: { type: String },
    text: { type: String },
  },
  { _id: false },
);

const verificationSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    claimantId: { type: String, required: true, index: true },
    answers: { type: [answerSchema], required: true, default: [] },
    proofs: { type: [proofSchema], required: true, default: [] },
    aiConsistencyScore: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true, index: true },
    reviewerId: { type: String },
    reviewerNote: { type: String },
    createdAt: { type: Date, required: true },
    decidedAt: { type: Date },
  },
  { versionKey: false },
);

export const VerificationModel = model<VerificationDoc>(
  'OwnershipVerification',
  verificationSchema,
);
