import { createHash } from 'node:crypto';

import type { Id } from '../shared/id.js';

export interface RefreshTokenSnapshot {
  id: Id;
  userId: Id;
  tokenHash: string;
  parentId?: Id; // for rotation chain
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export class RefreshToken {
  private constructor(private state: RefreshTokenSnapshot) {}
  static rehydrate(s: RefreshTokenSnapshot): RefreshToken {
    return new RefreshToken({ ...s });
  }
  static issue(input: {
    id: Id;
    userId: Id;
    rawToken: string;
    expiresAt: Date;
    parentId?: Id;
    userAgent?: string;
    ip?: string;
  }): RefreshToken {
    return new RefreshToken({
      id: input.id,
      userId: input.userId,
      tokenHash: hashToken(input.rawToken),
      parentId: input.parentId,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    });
  }
  get snapshot(): RefreshTokenSnapshot {
    return { ...this.state };
  }
  isActive(now: Date): boolean {
    return !this.state.revokedAt && this.state.expiresAt > now;
  }
  revoke(): void {
    this.state.revokedAt = new Date();
  }
  matches(rawToken: string): boolean {
    return this.state.tokenHash === hashToken(rawToken);
  }
}

export const hashToken = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex');
