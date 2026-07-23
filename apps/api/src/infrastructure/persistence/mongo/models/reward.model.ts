import { Schema, model } from 'mongoose';

import type { RewardSnapshot } from '../../../../domain/reward/reward.entity.js';

export type RewardDoc = Omit<RewardSnapshot, 'id'> & { _id: string };

const rewardSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    pointsBonus: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'held', 'released', 'cancelled', 'refunded'],
      required: true,
    },
    finderId: { type: String },
    releasedAt: { type: Date },
    commissionAmount: { type: Number },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const RewardModel = model<RewardDoc>('Reward', rewardSchema);
