import { Schema, model } from 'mongoose';

import type { PartnerApiKeySnapshot } from '../../../../domain/institution/partner-api-key.entity.js';

export type PartnerApiKeyDoc = Omit<PartnerApiKeySnapshot, 'id'> & { _id: string };

const partnerApiKeySchema = new Schema(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    keyHash: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
    lastUsedAt: { type: Date },
  },
  { versionKey: false },
);

export const PartnerApiKeyModel = model<PartnerApiKeyDoc>('PartnerApiKey', partnerApiKeySchema);
