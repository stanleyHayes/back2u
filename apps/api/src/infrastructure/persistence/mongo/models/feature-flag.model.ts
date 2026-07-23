import { Schema, model } from 'mongoose';

import type { FeatureFlagSnapshot } from '../../../../domain/feature-flag/feature-flag.entity.js';

export type FeatureFlagDoc = Omit<FeatureFlagSnapshot, 'id'> & { _id: string };

const featureFlagSchema = new Schema(
  {
    _id: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, required: true, default: false },
    rolloutPercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
    allowedUserIds: { type: [String], required: true, default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const FeatureFlagModel = model<FeatureFlagDoc>('FeatureFlag', featureFlagSchema);
