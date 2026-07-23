import { createHmac, timingSafeEqual } from 'node:crypto';

import { inject, injectable } from 'inversify';

import type { ITwilioSignatureVerifier } from '../../../application/ports/extra-services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

@injectable()
export class TwilioSignatureVerifier implements ITwilioSignatureVerifier {
  private readonly authToken: string | null;

  constructor(@inject(TOKENS.Env) env: Env) {
    this.authToken = env.TWILIO_AUTH_TOKEN?.trim() || null;
  }

  verify(signature: string | undefined, url: string, params: Record<string, string>): boolean {
    if (!this.authToken || !signature) return false;
    // Twilio signs url + each POST param as keyName+value, sorted by key.
    const data = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + (params[key] ?? ''), url);
    const expected = createHmac('sha1', this.authToken).update(data).digest('base64');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
