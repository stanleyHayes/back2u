import type { Id } from '../shared/id.js';

export type ModerationQueueItemType = 'item' | 'message' | 'user';
export type ModerationQueueItemStatus = 'pending' | 'reviewed';

export interface ModerationQueueItemSnapshot {
  id: Id;
  type: ModerationQueueItemType;
  targetId: Id;
  reason: string;
  status: ModerationQueueItemStatus;
  score: number;
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: Id;
  reviewerDecision?: 'approve' | 'remove';
}

export class ModerationQueueItem {
  private constructor(private state: ModerationQueueItemSnapshot) {}

  static rehydrate(s: ModerationQueueItemSnapshot): ModerationQueueItem {
    return new ModerationQueueItem({ ...s });
  }

  static create(input: {
    id: Id;
    type: ModerationQueueItemType;
    targetId: Id;
    reason: string;
    score: number;
  }): ModerationQueueItem {
    return new ModerationQueueItem({
      ...input,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  get snapshot(): ModerationQueueItemSnapshot {
    return { ...this.state };
  }

  review(reviewerId: Id, decision: 'approve' | 'remove'): void {
    this.state.status = 'reviewed';
    this.state.reviewerId = reviewerId;
    this.state.reviewerDecision = decision;
    this.state.reviewedAt = new Date();
  }
}
