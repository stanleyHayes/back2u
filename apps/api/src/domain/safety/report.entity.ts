import type { Id } from '../shared/id.js';

export type ReportTarget = 'user' | 'item' | 'message' | 'listing';
export type ReportReason = 'scam' | 'harassment' | 'spam' | 'inappropriate' | 'other';
export type ReportStatus = 'open' | 'actioned' | 'dismissed';

export interface ReportSnapshot {
  id: Id;
  reporterId: Id;
  target: ReportTarget;
  targetId: Id;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  reviewerId?: Id;
  reviewerNote?: string;
  createdAt: Date;
  decidedAt?: Date;
}

export class Report {
  private constructor(private state: ReportSnapshot) {}
  static rehydrate(s: ReportSnapshot): Report {
    return new Report({ ...s });
  }
  static file(input: {
    id: Id;
    reporterId: Id;
    target: ReportTarget;
    targetId: Id;
    reason: ReportReason;
    note?: string;
  }): Report {
    return new Report({ ...input, status: 'open', createdAt: new Date() });
  }
  get snapshot(): ReportSnapshot {
    return { ...this.state };
  }
  action(reviewerId: Id, note?: string): void {
    this.state.status = 'actioned';
    this.state.reviewerId = reviewerId;
    this.state.reviewerNote = note;
    this.state.decidedAt = new Date();
  }
  dismiss(reviewerId: Id, note?: string): void {
    this.state.status = 'dismissed';
    this.state.reviewerId = reviewerId;
    this.state.reviewerNote = note;
    this.state.decidedAt = new Date();
  }
}
