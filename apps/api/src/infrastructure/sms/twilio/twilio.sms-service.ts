import { inject, injectable } from 'inversify';
import type { Locale } from '@back2u/shared-types';

import type { II18nService, ILogger, ISmsService } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

@injectable()
export class TwilioSmsService implements ISmsService {
  private readonly accountSid: string | null;
  private readonly authToken: string | null;
  private readonly fromNumber: string | null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.I18nService) private readonly i18n: II18nService,
  ) {
    this.accountSid = env.TWILIO_ACCOUNT_SID?.trim() || null;
    this.authToken = env.TWILIO_AUTH_TOKEN?.trim() || null;
    this.fromNumber = env.TWILIO_FROM_NUMBER?.trim() || null;
  }

  async sendOtp(toPhone: string, code: string, locale?: Locale): Promise<void> {
    await this.send(toPhone, this.i18n.t('sms.otp.body', locale, { code }));
  }

  async send(toPhone: string, body: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      this.logger.info('sms noop (no Twilio keys)', { toPhone, body });
      return;
    }
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: toPhone, From: this.fromNumber, Body: body }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn('twilio send failed', { toPhone, status: res.status });
      throw new Error(`Twilio send failed: ${res.status} ${text}`);
    }
  }

  parseInbound(payload: unknown): { fromPhone: string; body: string } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    const from = p.From ?? p.from;
    const body = p.Body ?? p.body;
    if (typeof from !== 'string' || typeof body !== 'string') return null;
    return { fromPhone: from, body };
  }
}
