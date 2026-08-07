import { inject, injectable } from 'inversify';
import type { Locale } from '@back2u/shared-types';

import type { II18nService, ILogger, ISmsService } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

const ARKESEL_SEND_URL = 'https://sms.arkesel.com/api/v2/sms/send';

/**
 * Arkesel SMS adapter (Ghana). Sends transactional OTP / notification SMS via
 * the Arkesel v2 REST API. Auth is a single `api-key` header; messages are sent
 * from a pre-registered alphanumeric sender ID.
 *
 * If the API key or sender ID is not configured the adapter no-ops (logs and
 * returns) so local/dev and tests never hit the network.
 */
@injectable()
export class ArkeselSmsService implements ISmsService {
  private readonly apiKey: string | null;
  private readonly senderId: string | null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.I18nService) private readonly i18n: II18nService,
  ) {
    this.apiKey = env.ARKESEL_API_KEY?.trim() || null;
    this.senderId = env.ARKESEL_SENDER_ID?.trim() || null;
  }

  async sendOtp(toPhone: string, code: string, locale?: Locale): Promise<void> {
    await this.send(toPhone, this.i18n.t('sms.otp.body', locale, { code }));
  }

  async send(toPhone: string, body: string): Promise<void> {
    if (!this.apiKey || !this.senderId) {
      // Never log `body` — for OTP sends it contains the one-time code in cleartext.
      this.logger.info('sms noop (no Arkesel keys)', { toPhone, bodyLength: body.length });
      return;
    }
    // Arkesel expects international format without the leading "+", e.g. 233541234567.
    const recipient = toPhone.replace(/[^\d]/g, '');
    const res = await fetch(ARKESEL_SEND_URL, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sender: this.senderId, message: body, recipients: [recipient] }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn('arkesel send failed', { toPhone, status: res.status });
      throw new Error(`Arkesel send failed: ${res.status} ${text}`);
    }
    // Arkesel returns 200 with { status: "success" | "error", ... } — treat a
    // non-"success" status as a failure so the caller can log/retry.
    const json = (await res.json().catch(() => null)) as { status?: string } | null;
    if (json && json.status && json.status !== 'success') {
      this.logger.warn('arkesel send rejected', { toPhone, status: json.status });
      throw new Error(`Arkesel send rejected: ${json.status}`);
    }
  }

  parseInbound(payload: unknown): { fromPhone: string; body: string } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    // Arkesel inbound/reply webhooks post the sender's number as `sender`/`from`
    // and the text as `message`/`content`. Accept the Twilio-style keys too so a
    // provider swap doesn't silently break inbound.
    const from = p.sender ?? p.from ?? p.From ?? p.msisdn;
    const body = p.message ?? p.content ?? p.body ?? p.Body ?? p.text;
    if (typeof from !== 'string' || typeof body !== 'string') return null;
    return { fromPhone: from, body };
  }
}
