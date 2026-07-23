import mongoose from 'mongoose';

import type {
  Classification,
  GeoPoint,
  ItemImage,
  ItemKind,
  ItemStatus,
  PlaceRef,
} from '@back2u/shared-types';

export interface ItemDoc {
  _id: string;
  kind: ItemKind;
  classification: Classification;
  status: ItemStatus;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: ItemImage[];
  place: PlaceRef;
  occurredAt: Date;
  postedById: string;
  rewardId?: string;
  institutionId?: string;
  qrTagCode?: string;
  policeCaseId?: string;
  serialNumber?: string;
  imei?: string;
  duplicateOfId?: string;
  perceptualHash?: string;
  textEmbedding?: number[];
  imageEmbedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  bumpedAt?: Date;
  flaggedForReview?: boolean;
}

const imageSchema = new mongoose.Schema<ItemImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false },
);

const geoPointSchema = new mongoose.Schema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const placeSchema = new mongoose.Schema<PlaceRef>(
  {
    name: { type: String, required: true },
    city: { type: String },
    country: { type: String },
    point: { type: geoPointSchema, required: true },
  },
  { _id: false },
);

const itemSchema = new mongoose.Schema<ItemDoc>(
  {
    _id: { type: String, required: true },
    kind: { type: String, enum: ['lost', 'found'], required: true },
    classification: { type: String, enum: ['lost', 'stolen'], required: true },
    status: {
      type: String,
      enum: ['open', 'matched', 'claimed', 'returned', 'closed', 'archived', 'auctioned', 'donated'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },
    place: { type: placeSchema, required: true },
    occurredAt: { type: Date, required: true },
    postedById: { type: String, required: true },
    rewardId: { type: String },
    institutionId: { type: String },
    qrTagCode: { type: String },
    policeCaseId: { type: String },
    serialNumber: { type: String },
    imei: { type: String },
    duplicateOfId: { type: String },
    perceptualHash: { type: String },
    textEmbedding: { type: [Number], default: undefined },
    imageEmbedding: { type: [Number], default: undefined },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    expiresAt: { type: Date },
    bumpedAt: { type: Date },
    flaggedForReview: { type: Boolean },
  },
  { collection: 'items', versionKey: false },
);

itemSchema.index({ 'place.point': '2dsphere' });
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });
itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ kind: 1, status: 1, createdAt: -1 });
itemSchema.index({ kind: 1, category: 1, createdAt: -1 });
itemSchema.index({ category: 1, createdAt: -1 });
itemSchema.index({ postedById: 1, createdAt: -1 });
itemSchema.index({ institutionId: 1, createdAt: -1 });
itemSchema.index({ qrTagCode: 1 }, { unique: true, sparse: true });
itemSchema.index({ perceptualHash: 1 }, { sparse: true });
itemSchema.index({ flaggedForReview: 1, createdAt: -1 }, { sparse: true });
itemSchema.index({ expiresAt: 1 }, { sparse: true });

export const ItemModel = mongoose.model<ItemDoc>('Item', itemSchema);
