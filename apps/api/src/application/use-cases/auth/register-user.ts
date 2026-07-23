import { inject, injectable } from 'inversify';
import type { AuthResponse, RegisterInput, UserDTO } from '@back2u/shared-types';

import { RefreshToken } from '../../../domain/auth/refresh-token.entity.js';
import { ConflictError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { User } from '../../../domain/user/user.entity.js';
import type { IRefreshTokenRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type {
  IEmailService,
  ILogger,
  IPasswordHasher,
  ITokenService,
} from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

export interface SessionMeta {
  parentId?: Id;
  userAgent?: string;
  ip?: string;
}

export function toUserDTO(user: User): UserDTO {
  const s = user.snapshot;
  return {
    id: s.id,
    email: s.email,
    name: s.name,
    phone: s.phone,
    avatarUrl: s.avatarUrl,
    roles: s.roles,
    status: s.status,
    reputationScore: s.reputationScore,
    pointsBalance: s.pointsBalance,
    successfulReturns: s.successfulReturns,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    emailVerified: s.emailVerified,
    phoneVerified: s.phoneVerified,
    mfaEnabled: s.mfaEnabled === true,
    trustedFinder: s.trustedFinder,
    institutionId: s.institutionId,
    locale: s.locale,
    badges: s.badges,
    pushTokens: s.pushTokens,
    emailPreferences: s.emailPreferences,
    createdAt: s.createdAt.toISOString(),
  };
}

/** Signs an access/refresh pair and persists the hashed refresh token. */
export async function startSession(
  deps: { tokens: ITokenService; refreshTokens: IRefreshTokenRepository },
  user: User,
  meta?: SessionMeta,
): Promise<AuthResponse> {
  const s = user.snapshot;
  const access = deps.tokens.signAccess({
    sub: s.id,
    roles: s.roles,
    email: s.email,
    ...(s.institutionId ? { institutionId: s.institutionId } : {}),
  });
  const refresh = deps.tokens.signRefresh(s.id);
  await deps.refreshTokens.save(
    RefreshToken.issue({
      id: newId(),
      userId: s.id,
      rawToken: refresh.token,
      expiresAt: refresh.expiresAt,
      parentId: meta?.parentId,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    }),
  );
  return {
    user: toUserDTO(user),
    tokens: {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
    },
  };
}

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.PasswordHasher) private readonly hasher: IPasswordHasher,
    @inject(TOKENS.TokenService) private readonly tokens: ITokenService,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: RegisterInput, meta?: SessionMeta): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.hasher.hash(input.password);
    const user = User.create({
      id: newId(),
      email,
      name: input.name.trim(),
      passwordHash,
      ...(input.phone ? { phone: input.phone.trim() } : {}),
    });
    await this.users.save(user);

    this.email
      .sendWelcome(user.snapshot.email, user.snapshot.name, user.snapshot.locale)
      .catch((err) => this.logger.warn('welcome email failed', { err: String(err) }));

    return startSession({ tokens: this.tokens, refreshTokens: this.refreshTokens }, user, meta);
  }
}
