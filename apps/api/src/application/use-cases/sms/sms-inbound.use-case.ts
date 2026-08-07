import { inject, injectable } from 'inversify';

import { UnauthorizedError } from '../../../domain/shared/errors.js';
import type { IQrTagRepository, IUserRepository } from '../../ports/repositories.js';
import type { ILogger, IRealtimeBus, ISmsService } from '../../ports/services.js';
import type { IInboundSmsVerifier } from '../../ports/extra-services.js';
import { TOKENS } from '../../ports/tokens.js';

const HELP_REPLY =
  'bak2me commands: LOST <tag code> to report a tagged item lost, FOUND <tag code> to notify its owner.';

/** An inbound-SMS reply plus whether it is safe to send it back out (billed) over the SMS API. */
type Reply = { reply: string; send: boolean };

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

    const result: Reply =
      (command === 'LOST' || command === 'FOUND') && !code
        ? { reply: HELP_REPLY, send: false }
        : command === 'LOST'
          ? await this.handleLost(parsed.fromPhone, code)
          : command === 'FOUND'
            ? await this.handleFound(parsed.fromPhone, code)
            : { reply: HELP_REPLY, send: false };

    // Unlike Twilio's TwiML response, an Arkesel reply is a fresh (billed) SMS to
    // `fromPhone`, which is caller-supplied and only gated by a static shared
    // secret. To avoid turning this endpoint into an SMS amplifier, we send a
    // reply ONLY for genuinely successful actions (send=true) — never HELP or
    // "not found" text to arbitrary numbers. NOTE: also rate-limit / IP-allowlist
    // this route to Arkesel's servers in front of the app.
    if (result.send) {
      await this.sms
        .send(parsed.fromPhone, result.reply)
        .catch((err) => this.logger.warn('inbound sms reply failed', { err: String(err) }));
    }

    return { reply: result.reply };
  }

  private async handleLost(fromPhone: string, code: string): Promise<Reply> {
    const user = await this.users.findByPhone(fromPhone);
    const tag = await this.tags.findByCode(code);
    if (!user || !tag || tag.snapshot.ownerId !== user.id) {
      return { reply: `We could not find tag ${code} registered to your number.`, send: false };
    }
    tag.markLost();
    await this.tags.save(tag);
    this.logger.info('tag marked lost via SMS', { code });
    // Safe to SMS: recipient is the tag's verified owner (findByPhone === ownerId).
    return {
      reply: `Tag ${code} is now marked as lost. You will be alerted when it is scanned.`,
      send: true,
    };
  }

  private async handleFound(fromPhone: string, code: string): Promise<Reply> {
    const tag = await this.tags.findByCode(code);
    if (!tag || !tag.snapshot.ownerId) {
      return { reply: `We could not find tag ${code}.`, send: false };
    }
    this.bus.publishToUser(tag.snapshot.ownerId, 'tag:found-sms', { code, fromPhone });
    this.logger.info('tag reported found via SMS', { code });
    // Requires a valid registered tag code, so this is not a free amplifier.
    return { reply: `Thank you! The owner of tag ${code} has been notified.`, send: true };
  }
}
