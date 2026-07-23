import { Schema, model } from 'mongoose';

import type { ModerationQueueItemSnapshot } from '../../../../domain/moderation/moderation-queue-item.entity.js';

export type ModerationQueueItemDoc = Omit<ModerationQueueItemSnapshot, 'id'> & { _id: string };

const moderationQueueItemSchema = new Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, enum: ['item', 'message', 'user'], required: true },
    targetId: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed'], required: true },
    score: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    reviewedAt: { type: Date },
    reviewerId: { type: String },
    reviewerDecision: { type: String, enum: ['approve', 'remove'] },
  },
  { versionKey: false },
);
moderationQueueItemSchema.index({ status: 1, createdAt: -1 });
moderationQueueItemSchema.index({ type: 1, status: 1 });
moderationQueueItemSchema.index({ targetId: 1 });

export const ModerationQueueItemModel = model<ModerationQueueItemDoc>(
  'ModerationQueueItem',
  moderationQueueItemSchema,
);
