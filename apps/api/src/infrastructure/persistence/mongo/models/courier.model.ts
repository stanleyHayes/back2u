import { Schema, model } from 'mongoose';

import type { CourierJobSnapshot } from '../../../../domain/courier/courier-job.entity.js';

export type CourierJobDoc = Omit<CourierJobSnapshot, 'id'> & { _id: string };

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const placeRefSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String },
    country: { type: String },
    point: { type: geoPointSchema, required: true },
  },
  { _id: false },
);

const courierJobSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    pickup: { type: placeRefSchema, required: true },
    dropoff: { type: placeRefSchema, required: true },
    fee: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      required: true,
      index: true,
    },
    riderId: { type: String },
    requesterId: { type: String, required: true, index: true },
    pickupCode: { type: String, required: true },
    deliveryCode: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
courierJobSchema.index({ 'pickup.point': '2dsphere' });

export const CourierJobModel = model<CourierJobDoc>('CourierJob', courierJobSchema);
