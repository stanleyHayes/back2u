import { Schema, model } from 'mongoose';

import type { ZoneSubscriptionSnapshot } from '../../../../domain/subscription/zone-subscription.entity.js';

export type ZoneSubscriptionDoc = Omit<ZoneSubscriptionSnapshot, 'id'> & { _id: string };

const zoneSubscriptionSchema = new Schema(
  {
    _id: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    polygon: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    channels: {
      type: [String],
      enum: ['push', 'email', 'sms'],
      required: true,
      default: [],
    },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
zoneSubscriptionSchema.index({ polygon: '2dsphere' });

export const ZoneSubscriptionModel = model<ZoneSubscriptionDoc>(
  'ZoneSubscription',
  zoneSubscriptionSchema,
);
