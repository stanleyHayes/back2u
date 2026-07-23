import { inject, injectable } from 'inversify';

import { generate6DigitCode, Otp } from '../../../domain/auth/otp.entity.js';
import { ValidationError } from '../../../domain/shared/errors.js';
import { newId } from '../../../domain/shared/id.js';
import type { IOtpRepository } from '../../ports/auth-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { ILogger, ISmsService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const OTP_TTL_SECONDS = 600;

@injectable()
export class RequestPhoneOtpUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.OtpRepository) private readonly otps: IOtpRepository,
    @inject(TOKENS.SmsService) private readonly sms: ISmsService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(phone: string): Promise<{ sent: true }> {
    const user = await this.users.findByPhone(phone);

    const code = generate6DigitCode();
    await this.otps.save(
      Otp.issue({
        id: newId(),
        userId: user?.snapshot.id,
        channel: 'phone',
        destination: phone,
        code,
        ttlSeconds: OTP_TTL_SECONDS,
      }),
    );

    this.sms
      .sendOtp(phone, code, user?.snapshot.locale)
      .catch((err) => this.logger.warn('otp sms failed', { err: String(err) }));

    return { sent: true };
  }
}

@injectable()
export class VerifyPhoneOtpUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.OtpRepository) private readonly otps: IOtpRepository,
  ) {}

  async execute(input: { phone: string; code: string }): Promise<{ verified: true }> {
    const otp = await this.otps.findActiveForDestination(input.phone, 'phone');
    if (!otp) throw new ValidationError('Invalid or expired code');

    const result = otp.verify(input.code, new Date());
    await this.otps.save(otp);
    if (!result.ok) throw new ValidationError('Invalid or expired code', { reason: result.reason });

    const user = otp.snapshot.userId
      ? await this.users.findById(otp.snapshot.userId)
      : await this.users.findByPhone(input.phone);
    if (user && user.snapshot.phone === input.phone) {
      user.verifyPhone();
      await this.users.save(user);
    }

    return { verified: true };
  }
}
