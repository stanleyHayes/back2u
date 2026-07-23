import { hashToken } from './refresh-token.entity.js';
import type { Id } from '../shared/id.js';

export interface PasswordResetSnapshot {
  id: Id;
  userId: Id;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

export class PasswordReset {
  private constructor(private state: PasswordResetSnapshot) {}
  static rehydrate(s: PasswordResetSnapshot): PasswordReset {
    return new PasswordReset({ ...s });
  }
  static issue(input: { id: Id; userId: Id; rawToken: string; ttlSeconds: number }): PasswordReset {
    return new PasswordReset({
      id: input.id,
      userId: input.userId,
      tokenHash: hashToken(input.rawToken),
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
      createdAt: new Date(),
    });
  }
  get snapshot(): PasswordResetSnapshot {
    return { ...this.state };
  }
  verify(rawToken: string, now: Date): { ok: boolean; reason?: string } {
    if (this.state.consumedAt) return { ok: false, reason: 'already_consumed' };
    if (this.state.expiresAt < now) return { ok: false, reason: 'expired' };
    if (this.state.tokenHash !== hashToken(rawToken)) return { ok: false, reason: 'invalid_token' };
    this.state.consumedAt = now;
    return { ok: true };
  }
}
