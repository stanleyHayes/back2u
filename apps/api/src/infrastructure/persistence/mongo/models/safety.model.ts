import mongoose from 'mongoose';

import type { ReportReason, ReportStatus, ReportTarget } from '../../../../domain/safety/report.entity.js';

// ── Blocks ──────────────────────────────────────────────────────────────────

export interface BlockDoc {
  _id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

const blockSchema = new mongoose.Schema<BlockDoc>(
  {
    _id: { type: String, required: true },
    blockerId: { type: String, required: true },
    blockedId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'blocks', versionKey: false },
);

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
blockSchema.index({ blockerId: 1, createdAt: -1 });

export const BlockModel = mongoose.model<BlockDoc>('Block', blockSchema);

// ── Reports ─────────────────────────────────────────────────────────────────

export interface ReportDoc {
  _id: string;
  reporterId: string;
  target: ReportTarget;
  targetId: string;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  reviewerId?: string;
  reviewerNote?: string;
  createdAt: Date;
  decidedAt?: Date;
}

const reportSchema = new mongoose.Schema<ReportDoc>(
  {
    _id: { type: String, required: true },
    reporterId: { type: String, required: true },
    target: { type: String, enum: ['user', 'item', 'message', 'listing'], required: true },
    targetId: { type: String, required: true },
    reason: {
      type: String,
      enum: ['scam', 'harassment', 'spam', 'inappropriate', 'other'],
      required: true,
    },
    note: { type: String },
    status: { type: String, enum: ['open', 'actioned', 'dismissed'], default: 'open' },
    reviewerId: { type: String },
    reviewerNote: { type: String },
    createdAt: { type: Date, required: true },
    decidedAt: { type: Date },
  },
  { collection: 'reports', versionKey: false },
);

reportSchema.index({ status: 1, createdAt: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ target: 1, targetId: 1 });

export const ReportModel = mongoose.model<ReportDoc>('Report', reportSchema);
