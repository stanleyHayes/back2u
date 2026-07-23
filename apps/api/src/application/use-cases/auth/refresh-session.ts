import { inject, injectable } from 'inversify';
import type { AuthResponse } from '@back2u/shared-types';

import { hashToken } from '../../../domain/auth/refresh-token.entity.js';
import { UnauthorizedError } from '../../../domain/shared/errors.js';
import type { IRefreshTokenRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { ITokenService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { startSession, type SessionMeta } from './register-user.js';

@injectable()
export class RefreshSessionUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.TokenService) private readonly tokens: ITokenService,
  ) {}

  async execute(refreshToken: string, meta?: SessionMeta): Promise<AuthResponse> {
    let sub: string;
    try {
      sub = this.tokens.verifyRefresh(refreshToken).sub;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = await this.refreshTokens.findByHash(hashToken(refreshToken));
    if (!stored || stored.snapshot.userId !== sub) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (!stored.isActive(new Date())) {
      // Reuse of a rotated/expired token — kill the whole session chain.
      await this.refreshTokens.revokeAllForUser(stored.snapshot.userId);
      throw new UnauthorizedError('Refresh token expired or revoked');
    }

    const user = await this.users.findById(stored.snapshot.userId);
    if (!user || user.snapshot.status !== 'active') {
      throw new UnauthorizedError('Account unavailable');
    }

    stored.revoke();
    await this.refreshTokens.save(stored);

    return startSession(
      { tokens: this.tokens, refreshTokens: this.refreshTokens },
      user,
      { ...meta, parentId: stored.snapshot.id },
    );
  }
}

@injectable()
export class LogoutUseCase {
  constructor(
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async execute(refreshToken: string): Promise<{ ok: true }> {
    const stored = await this.refreshTokens.findByHash(hashToken(refreshToken));
    if (stored && stored.isActive(new Date())) {
      stored.revoke();
      await this.refreshTokens.save(stored);
    }
    return { ok: true };
  }
}
