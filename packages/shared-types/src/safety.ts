export interface SafetyReportDTO {
  id: string;
  reporterId: string;
  target: 'user' | 'item' | 'message' | 'listing';
  targetId: string;
  reason: 'scam' | 'harassment' | 'spam' | 'inappropriate' | 'other';
  note?: string;
  status: 'open' | 'actioned' | 'dismissed' | 'resolved';
  createdAt: string;
  decidedAt?: string;
  reviewerId?: string;
  reviewerNote?: string;
}

export interface ModerationQueueItemDTO {
  id: string;
  type: 'item' | 'message' | 'user';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed';
  score: number;
  createdAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerDecision?: 'approve' | 'remove';
}
