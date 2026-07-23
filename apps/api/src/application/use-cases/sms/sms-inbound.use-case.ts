import { inject, injectable } from 'inversify';

import { UnauthorizedError } from '../../../domain/shared/errors.js';
import type { IQrTagRepository, IUserRepository } from '../../ports/repositories.js';
import type { ILogger, IRealtimeBus, ISmsService } from '../../ports/services.js';
import type { ITwilioSignatureVerifier } from '../../ports/extra-services.js';
import { TOKENS } from '../../ports/tokens.js';

const HELP_REPLY = 'Back2u commands: LOST <tag code> to report a tagged item lost, FOUND <tag code> to notify its owner.';

@injectable()
export class HandleInboundSmsUseCase {
  constructor(
    @inject(TOKENS.SmsService) private readonly sms: ISmsService,
    @inject(TOKENS.TwilioSignatureVerifier) private readonly verifier: ITwilioSignatureVerifier,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(
    payload: Record<string, string>,
    signature: string | undefined,
    url: string,
  ): Promise<{ reply: string }> {
    if (!this.verifier.verify(signature, url, payload)) {
      throw new UnauthorizedError('Invalid Twilio signature');
    }
    const parsed = this.sms.parseInbound(payload);
    if (!parsed) return { reply: HELP_REPLY };

    const [commandRaw, codeRaw] = parsed.body.trim().split(/\s+/, 2);
    const command = (commandRaw ?? '').toUpperCase();
    const code = (codeRaw ?? '').trim();

    if ((command === 'LOST' || command === 'FOUND') && !code) {
      return { reply: HELP_REPLY };
    }

    switch (command) {
      case 'LOST':
        return { reply: await this.handleLost(parsed.fromPhone, code) };
      case 'FOUND':
        return { reply: await this.handleFound(parsed.fromPhone, code) };
      case 'STOP':
      case 'START':
      case 'HELP':
      default:
        return { reply: HELP_REPLY };
    }
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
