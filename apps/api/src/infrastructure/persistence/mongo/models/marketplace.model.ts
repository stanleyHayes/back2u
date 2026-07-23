import { Schema, model } from 'mongoose';

import type {
  BidSnapshot,
  MarketplaceListingSnapshot,
} from '../../../../domain/marketplace_listing/marketplace-listing.entity.js';

export type MarketplaceListingDoc = Omit<MarketplaceListingSnapshot, 'id'> & { _id: string };
export type BidDoc = Omit<BidSnapshot, 'id'> & { _id: string };

const marketplaceListingSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    startingPrice: { type: Number, required: true },
    currency: { type: String, required: true },
    buyNowPrice: { type: Number },
    closesAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'live', 'sold', 'donated', 'withdrawn', 'cancelled'],
      required: true,
    },
    highBidId: { type: String },
    charityRecipient: { type: String },
    reminder24hSent: { type: Boolean },
    reminder1hSent: { type: Boolean },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
marketplaceListingSchema.index({ status: 1, closesAt: 1 });

const bidSchema = new Schema(
  {
    _id: { type: String, required: true },
    listingId: { type: String, required: true },
    bidderId: { type: String, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
bidSchema.index({ listingId: 1, createdAt: 1 });
bidSchema.index({ bidderId: 1, createdAt: -1 });

export const MarketplaceListingModel = model<MarketplaceListingDoc>(
  'MarketplaceListing',
  marketplaceListingSchema,
);
export const BidModel = model<BidDoc>('Bid', bidSchema);
