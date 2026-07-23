import { inject, injectable } from 'inversify';
import type { AuthResponse, MfaSetupResponse, UserDTO } from '@back2u/shared-types';

import { hashToken } from '../../../domain/auth/refresh-token.entity.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../../domain/shared/errors.js';
import type { User } from '../../../domain/user/user.entity.js';
import {
  generateTotpSecret,
  otpauthUrl,
  totpMatchStep,
} from '../../../infrastructure/security/totp.js';
import type { ICache } from '../../ports/cache.js';
import type { IRefreshTokenRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { IPasswordHasher, ITokenService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { startSession, toUserDTO, type SessionMeta } from './register-user.js';

/** Lifetime of the short-lived token bridging password login → TOTP check. */
export const MFA_CHALLENGE_TTL_SECONDS = 300;

/** Failed codes allowed per user before a cool-down kicks in. */
const MFA_MAX_FAILURES = 5;
const MFA_LOCKOUT_TTL_SECONDS = 300;

const failKey = (userId: string) => `mfa:fail:${userId}`;

/**
 * Per-account brute-force guard for TOTP codes (the per-IP rate limiter alone
 * is defeated by rotating proxies). Backed by the shared cache; degrades to a
 * no-op when Redis is unavailable, matching the rest of the cache layer.
 */
async function assertNotLocked(cache: ICache, userId: string): Promise<void> {
  const failures = (await cache.get<number>(failKey(userId))) ?? 0;
  if (failures >= MFA_MAX_FAILURES) {
    throw new TooManyRequestsError('Too many incorrect codes — try again in a few minutes');
  }
}

async function recordFailure(cache: ICache, userId: string): Promise<void> {
  const failures = (await cache.get<number>(failKey(userId))) ?? 0;
  await cache.set(failKey(userId), failures + 1, MFA_LOCKOUT_TTL_SECONDS);
}

/**
 * Verifies a code against a secret with replay protection: a time step at or
 * below the last accepted one is rejected even if the digits match
 * (RFC 6238 §5.2). Returns the matched step, or null when invalid.
 */
function matchFreshStep(user: User, secret: string, code: string): number | null {
  const step = totpMatchStep(secret, code);
  if (step === null || user.isMfaStepUsed(step)) return null;
  return step;
}

/** Begins TOTP enrollment: issues a secret the user must confirm with a code. */
@injectable()
export class SetupMfaUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<MfaSetupResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (user.mfaEnabled) throw new ConflictError('MFA is already enabled');

    const secret = generateTotpSecret();
    user.beginMfaEnrollment(secret);
    await this.users.save(user);

    return { secret, otpauthUrl: otpauthUrl({ secret, accountName: user.email }) };
  }
}

/** Confirms enrollment with the first authenticator code and turns MFA on. */
@injectable()
export class EnableMfaUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.Cache) private readonly cache: ICache,
  ) {}

  async execute(userId: string, code: string): Promise<UserDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    const pending = user.snapshot.mfaPendingSecret;
    if (!pending) throw new ConflictError('No MFA enrollment in progress — start setup first');

    await assertNotLocked(this.cache, userId);
    const step = totpMatchStep(pending, code);
    if (step === null) {
      await recordFailure(this.cache, userId);
      throw new UnauthorizedError('Invalid verification code');
    }

    user.enableMfa();
    user.markMfaStepUsed(step);
    await this.users.save(user);
    await this.cache.del(failKey(userId));
    return toUserDTO(user);
  }
}

/** Turns MFA off after re-proving control of the authenticator. */
@injectable()
export class DisableMfaUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.Cache) private readonly cache: ICache,
  ) {}

  async execute(userId: string, code: string): Promise<UserDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    const secret = user.snapshot.mfaSecret;
    if (!user.mfaEnabled || !secret) throw new ConflictError('MFA is not enabled');

    await assertNotLocked(this.cache, userId);
    if (matchFreshStep(user, secret, code) === null) {
      await recordFailure(this.cache, userId);
      throw new UnauthorizedError('Invalid verification code');
    }

    user.disableMfa();
    await this.users.save(user);
    await this.cache.del(failKey(userId));
    return toUserDTO(user);
  }
}

/** Completes a login that was answered with an MFA challenge. */
@injectable()
export class VerifyMfaLoginUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.TokenService) private readonly tokens: ITokenService,
    @inject(TOKENS.Cache) private readonly cache: ICache,
  ) {}

  async execute(mfaToken: string, code: string, meta?: SessionMeta): Promise<AuthResponse> {
    let claims: { sub?: string; purpose?: string };
    try {
      claims = this.tokens.verifyShortLived<{ sub?: string; purpose?: string }>(mfaToken);
    } catch {
      throw new UnauthorizedError('MFA session expired — sign in again');
    }
    if (claims.purpose !== 'mfa' || !claims.sub) {
      throw new UnauthorizedError('MFA session expired — sign in again');
    }

    const user = await this.users.findById(claims.sub);
    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (user.snapshot.status !== 'active') throw new ForbiddenError('Account is not active');

    const secret = user.snapshot.mfaSecret;
    if (!user.mfaEnabled || !secret) throw new ConflictError('MFA is not enabled');

    await assertNotLocked(this.cache, user.id);
    const step = matchFreshStep(user, secret, code);
    if (step === null) {
      await recordFailure(this.cache, user.id);
      throw new UnauthorizedError('Invalid verification code');
    }

    user.markMfaStepUsed(step);
    await this.users.save(user);
    await this.cache.del(failKey(user.id));

    return startSession({ tokens: this.tokens, refreshTokens: this.refreshTokens }, user, meta);
  }
}

/** In-session password change (as opposed to the emailed reset link flow). */
@injectable()
export class ChangePasswordUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.PasswordHasher) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
    /** The caller's own refresh token, spared from revocation so the session survives. */
    currentRefreshToken?: string,
  ): Promise<{ ok: true }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');

    const ok = await this.hasher.verify(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Current password is incorrect');

    user.changePasswordHash(await this.hasher.hash(newPassword));
    await this.users.save(user);
    // A changed password invalidates every other session; the one making the
    // change keeps its refresh token (when the client supplies it).
    await this.refreshTokens.revokeAllForUser(
      user.id,
      currentRefreshToken ? hashToken(currentRefreshToken) : undefined,
    );
    return { ok: true };
  }
}
