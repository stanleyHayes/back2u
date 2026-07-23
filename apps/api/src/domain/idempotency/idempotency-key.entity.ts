import { hashToken } from '../auth/refresh-token.entity.js';
import type { Id } from '../shared/id.js';

export interface IdempotencyRecordSnapshot {
  id: Id;
  keyHash: string;
  userId?: Id;
  method: string;
  path: string;
  status: number;
  responseBody: string;
  createdAt: Date;
  expiresAt: Date;
}

export class IdempotencyRecord {
  private constructor(private state: IdempotencyRecordSnapshot) {}
  static rehydrate(s: IdempotencyRecordSnapshot): IdempotencyRecord {
    return new IdempotencyRecord({ ...s });
  }
  static seal(input: {
    id: Id;
    rawKey: string;
    userId?: Id;
    method: string;
    path: string;
    status: number;
    responseBody: string;
    ttlSeconds: number;
  }): IdempotencyRecord {
    return new IdempotencyRecord({
      id: input.id,
      keyHash: hashToken(input.rawKey),
      userId: input.userId,
      method: input.method,
      path: input.path,
      status: input.status,
      responseBody: input.responseBody,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
    });
  }
  get snapshot(): IdempotencyRecordSnapshot {
    return { ...this.state };
  }
}
