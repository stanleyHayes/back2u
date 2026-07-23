import { inject, injectable } from 'inversify';

import { generate6DigitCode, Otp } from '../../../domain/auth/otp.entity.js';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IOtpRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { IEmailService, ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const OTP_TTL_SECONDS = 600;

@injectable()
export class RequestEmailVerificationUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.OtpRepository) private readonly otps: IOtpRepository,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(userId: Id): Promise<{ sent: true }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (user.snapshot.emailVerified) return { sent: true };

    const code = generate6DigitCode();
    await this.otps.save(
      Otp.issue({
        id: newId(),
        userId,
        channel: 'email',
        destination: user.snapshot.email,
        code,
        ttlSeconds: OTP_TTL_SECONDS,
      }),
    );

    this.email
      .sendGenericNotification(
        user.snapshot.email,
        user.snapshot.name,
        'Your Back2u verification code',
        `Your verification code is ${code}. It expires in 10 minutes.`,
        user.snapshot.locale,
      )
      .catch((err) => this.logger.warn('verification email failed', { err: String(err) }));

    return { sent: true };
  }
}

@injectable()
export class ConfirmEmailVerificationUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.OtpRepository) private readonly otps: IOtpRepository,
  ) {}

  async execute(userId: Id, code: string): Promise<{ verified: true }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');

    const otp = await this.otps.findActiveForDestination(user.snapshot.email, 'email');
    if (!otp) throw new ValidationError('Invalid or expired code');

    const result = otp.verify(code, new Date());
    await this.otps.save(otp);
    if (!result.ok) throw new ValidationError('Invalid or expired code', { reason: result.reason });

    user.verifyEmail();
    await this.users.save(user);
    return { verified: true };
  }
}
