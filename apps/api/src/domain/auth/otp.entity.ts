import { createHmac, randomInt } from 'node:crypto';

import type { Id } from '../shared/id.js';

export interface OtpSnapshot {
  id: Id;
  userId?: Id;
  channel: 'phone' | 'email';
  destination: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

const MAX_ATTEMPTS = 5;

export class Otp {
  private constructor(private state: OtpSnapshot) {}
  static rehydrate(s: OtpSnapshot): Otp {
    return new Otp({ ...s });
  }
  static issue(input: {
    id: Id;
    userId?: Id;
    channel: 'phone' | 'email';
    destination: string;
    code: string;
    ttlSeconds: number;
  }): Otp {
    return new Otp({
      id: input.id,
      userId: input.userId,
      channel: input.channel,
      destination: input.destination,
      codeHash: hashOtpCode(input.code),
      attempts: 0,
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
      createdAt: new Date(),
    });
  }
  get snapshot(): OtpSnapshot {
    return { ...this.state };
  }
  verify(code: string, now: Date): { ok: boolean; reason?: string } {
    if (this.state.consumedAt) return { ok: false, reason: 'already_consumed' };
    if (this.state.expiresAt < now) return { ok: false, reason: 'expired' };
    this.state.attempts += 1;
    if (this.state.attempts > MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' };
    if (this.state.codeHash !== hashOtpCode(code)) return { ok: false, reason: 'invalid_code' };
    this.state.consumedAt = now;
    return { ok: true };
  }
}

// OTP codes live in a 6-digit space, so an unsalted hash is trivially
// enumerable. Key the hash with a server-side pepper so a leaked codeHash
// column cannot be brute-forced offline.
const hashOtpCode = (code: string): string =>
  createHmac('sha256', process.env.JWT_ACCESS_SECRET ?? '').update(code).digest('hex');

export const generate6DigitCode = (): string => randomInt(100000, 1000000).toString();
