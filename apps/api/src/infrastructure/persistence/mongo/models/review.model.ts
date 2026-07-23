import { Schema, model } from 'mongoose';

import type { ReviewSnapshot } from '../../../../domain/review/review.entity.js';

export type ReviewDoc = Omit<ReviewSnapshot, 'id'> & { _id: string };

const reviewSchema = new Schema(
  {
    _id: { type: String, required: true },
    reviewerId: { type: String, required: true },
    revieweeId: { type: String, required: true },
    itemId: { type: String, required: true },
    matchId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
reviewSchema.index({ reviewerId: 1, matchId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1, createdAt: -1 });

export const ReviewModel = model<ReviewDoc>('Review', reviewSchema);
