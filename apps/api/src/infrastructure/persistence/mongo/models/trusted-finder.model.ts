import { Schema, model } from 'mongoose';

import type { TrustedFinderApplicationSnapshot } from '../../../../domain/trusted-finder/trusted-finder-application.entity.js';

export type TrustedFinderApplicationDoc = Omit<TrustedFinderApplicationSnapshot, 'id'> & {
  _id: string;
};

const trustedFinderApplicationSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true, index: true },
    reason: { type: String },
    idPhotoUrl: { type: String, required: true },
    bio: { type: String },
    createdAt: { type: Date, required: true },
    decidedAt: { type: Date },
  },
  { versionKey: false },
);

export const TrustedFinderApplicationModel = model<TrustedFinderApplicationDoc>(
  'TrustedFinderApplication',
  trustedFinderApplicationSchema,
);
