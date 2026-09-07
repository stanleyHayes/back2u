import { Schema, model } from 'mongoose';

import type { RewardOfferSnapshot } from '../../../../domain/reward_catalog/reward-offer.entity.js';

export type RewardOfferDoc = Omit<RewardOfferSnapshot, 'id'> & { _id: string };

const rewardOfferSchema = new Schema(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'mobile_data',
        'ride_credit',
        'delivery_discount',
        'restaurant_voucher',
        'retail_discount',
        'event_perk',
        'insurance_benefit',
        'merchandise',
      ],
      required: true,
    },
    imageUrl: { type: String },
    pointsCost: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'live', 'paused', 'ended'], required: true },
    totalInventory: { type: Number },
    remainingInventory: { type: Number },
    startsAt: { type: Date },
    endsAt: { type: Date },
    perUserLimit: { type: Number },
    minTrustLevel: {
      type: String,
      enum: ['new_finder', 'helper', 'trusted_finder', 'community_hero', 'guardian', 'legend'],
    },
    reservationHours: { type: Number, required: true },
    termsUrl: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'reward_offers' },
);

// The member-facing catalogue query: live offers, cheapest first.
rewardOfferSchema.index({ status: 1, startsAt: 1, endsAt: 1, pointsCost: 1 });

export const RewardOfferModel = model<RewardOfferDoc>('RewardOffer', rewardOfferSchema);
