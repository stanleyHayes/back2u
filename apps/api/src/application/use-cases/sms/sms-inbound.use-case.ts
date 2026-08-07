import { inject, injectable } from 'inversify';

import { UnauthorizedError } from '../../../domain/shared/errors.js';
import type { IQrTagRepository, IUserRepository } from '../../ports/repositories.js';
import type { ILogger, IRealtimeBus, ISmsService } from '../../ports/services.js';
import type { IInboundSmsVerifier } from '../../ports/extra-services.js';
import { TOKENS } from '../../ports/tokens.js';

const HELP_REPLY =
  'bak2me commands: LOST <tag code> to report a tagged item lost, FOUND <tag code> to notify its owner.';

@injectable()
export class HandleInboundSmsUseCase {
  constructor(
    @inject(TOKENS.SmsService) private readonly sms: ISmsService,
    @inject(TOKENS.InboundSmsVerifier) private readonly verifier: IInboundSmsVerifier,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(
    payload: Record<string, string>,
    secret: string | undefined,
  ): Promise<{ reply: string }> {
    if (!this.verifier.verify(secret)) {
      throw new UnauthorizedError('Invalid inbound SMS webhook secret');
    }
    const parsed = this.sms.parseInbound(payload);
    if (!parsed) return { reply: HELP_REPLY };

    const [commandRaw, codeRaw] = parsed.body.trim().split(/\s+/, 2);
    const command = (commandRaw ?? '').toUpperCase();
    const code = (codeRaw ?? '').trim();

    const reply =
      (command === 'LOST' || command === 'FOUND') && !code
        ? HELP_REPLY
        : command === 'LOST'
          ? await this.handleLost(parsed.fromPhone, code)
          : command === 'FOUND'
            ? await this.handleFound(parsed.fromPhone, code)
            : HELP_REPLY;

    // Arkesel has no synchronous reply channel (unlike Twilio's TwiML response),
    // so send the reply back out over the SMS API.
    await this.sms
      .send(parsed.fromPhone, reply)
      .catch((err) => this.logger.warn('inbound sms reply failed', { err: String(err) }));

    return { reply };
  }

  private async handleLost(fromPhone: string, code: string): Promise<string> {
    const user = await this.users.findByPhone(fromPhone);
    const tag = await this.tags.findByCode(code);
    if (!user || !tag || tag.snapshot.ownerId !== user.id) {
      return `We could not find tag ${code} registered to your number.`;
    }
    tag.markLost();
    await this.tags.save(tag);
    this.logger.info('tag marked lost via SMS', { code });
    return `Tag ${code} is now marked as lost. You will be alerted when it is scanned.`;
  }

  private async handleFound(fromPhone: string, code: string): Promise<string> {
    const tag = await this.tags.findByCode(code);
    if (!tag || !tag.snapshot.ownerId) {
      return `We could not find tag ${code}.`;
    }
    this.bus.publishToUser(tag.snapshot.ownerId, 'tag:found-sms', { code, fromPhone });
    this.logger.info('tag reported found via SMS', { code });
    return `Thank you! The owner of tag ${code} has been notified.`;
  }
}
