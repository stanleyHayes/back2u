import { inject, injectable } from 'inversify';
import type { AuthResponse, LoginInput } from '@back2u/shared-types';

import { ForbiddenError, UnauthorizedError } from '../../../domain/shared/errors.js';
import type { IRefreshTokenRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { IPasswordHasher, ITokenService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { startSession, type SessionMeta } from './register-user.js';

@injectable()
export class LoginUserUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.PasswordHasher) private readonly hasher: IPasswordHasher,
    @inject(TOKENS.TokenService) private readonly tokens: ITokenService,
  ) {}

  async execute(input: LoginInput, meta?: SessionMeta): Promise<AuthResponse> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');

    if (user.snapshot.status !== 'active') throw new ForbiddenError('Account is not active');

    return startSession({ tokens: this.tokens, refreshTokens: this.refreshTokens }, user, meta);
  }
}
