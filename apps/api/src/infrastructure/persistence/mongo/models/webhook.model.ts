import { Schema, model } from 'mongoose';

import type { WebhookSnapshot } from '../../../../domain/webhook/webhook.entity.js';

export type WebhookDoc = Omit<WebhookSnapshot, 'id'> & { _id: string };

const webhookSchema = new Schema(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    secret: { type: String, required: true },
    events: { type: [String], required: true, default: [] },
    active: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const WebhookModel = model<WebhookDoc>('Webhook', webhookSchema);
