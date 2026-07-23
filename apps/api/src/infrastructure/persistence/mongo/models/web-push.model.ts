import { Schema, model } from 'mongoose';

import type { WebPushSubscriptionSnapshot } from '../../../../domain/web_push/subscription.entity.js';

export type WebPushSubscriptionDoc = Omit<WebPushSubscriptionSnapshot, 'id'> & { _id: string };

const webPushSubscriptionSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      type: new Schema(
        {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true },
        },
        { _id: false },
      ),
      required: true,
    },
    userAgent: { type: String },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const WebPushSubscriptionModel = model<WebPushSubscriptionDoc>(
  'WebPushSubscription',
  webPushSubscriptionSchema,
);
