import { Schema, model } from 'mongoose';

import type { InstitutionSnapshot } from '../../../../domain/institution/institution.entity.js';

export type InstitutionDoc = Omit<InstitutionSnapshot, 'id'> & { _id: string };

const institutionSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'school',
        'airport',
        'transport',
        'event',
        'mall',
        'restaurant',
        'cafe',
        'retail',
        'pharmacy',
        'hotel',
        'other',
      ],
      required: true,
    },
    contactEmail: { type: String, required: true },
    place: {
      type: new Schema(
        {
          name: { type: String, required: true },
          city: { type: String },
          country: { type: String },
          point: {
            type: new Schema(
              {
                type: { type: String, enum: ['Point'], required: true },
                coordinates: { type: [Number], required: true },
              },
              { _id: false },
            ),
            required: true,
          },
        },
        { _id: false },
      ),
      required: true,
    },
    pointsRedeemable: { type: Boolean, required: true, default: false },
    pointToCurrencyRate: { type: Number },
    apiKeyHash: { type: String },
    webhookUrl: { type: String },
    subscriptionTier: { type: String, enum: ['free', 'pro', 'enterprise'] },
    subscriptionRenewsAt: { type: Date },
    rewardsListed: { type: Boolean, index: true },
    logoUrl: { type: String },
    description: { type: String },
    website: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
institutionSchema.index({ 'place.point': '2dsphere' });

export const InstitutionModel = model<InstitutionDoc>('Institution', institutionSchema);
