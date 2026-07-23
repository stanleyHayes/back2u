import { Schema, model } from 'mongoose';

import type { VaultEntrySnapshot } from '../../../../domain/vault/vault-entry.entity.js';

export type VaultEntryDoc = Omit<VaultEntrySnapshot, 'id'> & { _id: string };

const vaultEntrySchema = new Schema(
  {
    _id: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    category: { type: String, required: true },
    // Ciphertext fields — app-layer encrypted before they reach Mongo.
    serialNumber: { type: String },
    imei: { type: String },
    receiptImageUrl: { type: String },
    photoUrls: { type: [String], required: true, default: [] },
    notes: { type: String },
    encryptedBlob: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const VaultEntryModel = model<VaultEntryDoc>('VaultEntry', vaultEntrySchema);
