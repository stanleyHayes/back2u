import { Schema, model } from 'mongoose';

import type { QrTagOrderSnapshot } from '../../../../domain/tag/qr-tag-order.entity.js';
import type { QrTagProductSnapshot } from '../../../../domain/tag/qr-tag-product.entity.js';
import type { QrTagSnapshot } from '../../../../domain/tag/qr-tag.entity.js';

export type QrTagDoc = Omit<QrTagSnapshot, 'id'> & { _id: string };
export type QrTagProductDoc = Omit<QrTagProductSnapshot, 'id'> & { _id: string };
export type QrTagOrderDoc = Omit<QrTagOrderSnapshot, 'id'> & { _id: string };

const qrTagSchema = new Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    ownerId: { type: String, index: true },
    itemLabel: { type: String },
    status: {
      type: String,
      enum: ['unclaimed', 'active', 'lost', 'disabled'],
      required: true,
      index: true,
    },
    lastSeenAt: { type: Date },
    lastSeenPoint: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
qrTagSchema.index({ lastSeenPoint: '2dsphere' });

const qrTagProductSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, enum: ['GHS', 'NGN', 'USD', 'EUR', 'GBP'], required: true },
    quantity: { type: Number, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

const qrTagOrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    tagsPerPack: { type: Number, required: true },
  },
  { _id: false },
);

const qrTagOrderSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    products: { type: [qrTagOrderItemSchema], required: true, default: [] },
    total: { type: Number, required: true },
    currency: { type: String, enum: ['GHS', 'NGN', 'USD', 'EUR', 'GBP'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'fulfilled'], required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const QrTagModel = model<QrTagDoc>('QrTag', qrTagSchema);
export const QrTagProductModel = model<QrTagProductDoc>('QrTagProduct', qrTagProductSchema);
export const QrTagOrderModel = model<QrTagOrderDoc>('QrTagOrder', qrTagOrderSchema);
