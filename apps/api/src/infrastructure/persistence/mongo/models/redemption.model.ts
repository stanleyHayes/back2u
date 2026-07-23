import { Schema, model } from 'mongoose';

import type { RedemptionSnapshot } from '../../../../domain/redemption/redemption.entity.js';

export type RedemptionDoc = Omit<RedemptionSnapshot, 'id'> & { _id: string };

const redemptionSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    points: { type: Number, required: true },
    value: { type: Number, required: true },
    currency: { type: String, enum: ['GHS', 'NGN', 'USD', 'EUR', 'GBP'], required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'fulfilled', 'cancelled'], required: true },
    note: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    fulfilledAt: { type: Date },
  },
  { versionKey: false },
);

export const RedemptionModel = model<RedemptionDoc>('PointsRedemption', redemptionSchema);
