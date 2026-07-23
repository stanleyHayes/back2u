import type { IdempotencyRecord } from '../../domain/idempotency/idempotency-key.entity.js';
import type { Otp } from '../../domain/auth/otp.entity.js';
import type { PasswordReset } from '../../domain/auth/password-reset.entity.js';
import type { RefreshToken } from '../../domain/auth/refresh-token.entity.js';
import type { Id } from '../../domain/shared/id.js';

export interface IRefreshTokenRepository {
  save(t: RefreshToken): Promise<void>;
  findByHash(hash: string): Promise<RefreshToken | null>;
  revokeAllForUser(userId: Id): Promise<void>;
}

export interface IOtpRepository {
  save(o: Otp): Promise<void>;
  findActiveForDestination(destination: string, channel: 'phone' | 'email'): Promise<Otp | null>;
  findById(id: Id): Promise<Otp | null>;
}

export interface IPasswordResetRepository {
  save(p: PasswordReset): Promise<void>;
  findByHash(hash: string): Promise<PasswordReset | null>;
}

export interface IIdempotencyStore {
  get(keyHash: string, userId?: Id): Promise<IdempotencyRecord | null>;
  put(record: IdempotencyRecord): Promise<void>;
}
