import { randomBytes } from 'node:crypto';

import { inject, injectable } from 'inversify';

import { PasswordReset } from '../../../domain/auth/password-reset.entity.js';
import { hashToken } from '../../../domain/auth/refresh-token.entity.js';
import { ValidationError } from '../../../domain/shared/errors.js';
import { newId } from '../../../domain/shared/id.js';
import type { IPasswordResetRepository, IRefreshTokenRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { IEmailService, ILogger, IPasswordHasher } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const RESET_TTL_SECONDS = 3600;

@injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.PasswordResetRepository) private readonly resets: IPasswordResetRepository,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: { email: string; resetUrlBase: string }): Promise<{ sent: true }> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    // Never leak whether an account exists.
    if (!user) return { sent: true };

    const rawToken = randomBytes(32).toString('hex');
    await this.resets.save(
      PasswordReset.issue({
        id: newId(),
        userId: user.snapshot.id,
        rawToken,
        ttlSeconds: RESET_TTL_SECONDS,
      }),
    );

    const resetUrl = `${input.resetUrlBase}?token=${rawToken}`;
    this.email
      .sendPasswordReset(user.snapshot.email, user.snapshot.name, resetUrl, user.snapshot.locale)
      .catch((err) => this.logger.warn('password reset email failed', { err: String(err) }));

    return { sent: true };
  }
}

@injectable()
export class ConfirmPasswordResetUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.PasswordResetRepository) private readonly resets: IPasswordResetRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.PasswordHasher) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: { token: string; newPassword: string }): Promise<{ ok: true }> {
    const reset = await this.resets.findByHash(hashToken(input.token));
    if (!reset) throw new ValidationError('Invalid or expired reset token');

    const result = reset.verify(input.token, new Date());
    if (!result.ok) {
      throw new ValidationError('Invalid or expired reset token', { reason: result.reason });
    }
    await this.resets.save(reset);

    const user = await this.users.findById(reset.snapshot.userId);
    if (!user) throw new ValidationError('Invalid or expired reset token');

    user.changePasswordHash(await this.hasher.hash(input.newPassword));
    await this.users.save(user);
    await this.refreshTokens.revokeAllForUser(user.snapshot.id);

    return { ok: true };
  }
}
