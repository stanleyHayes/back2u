import { timingSafeEqual } from 'node:crypto';

import { inject, injectable } from 'inversify';

import type { IInboundSmsVerifier } from '../../../application/ports/extra-services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

/**
 * Verifies inbound Arkesel webhook calls. Arkesel does not sign requests, so the
 * callback URL carries a shared secret (as a `?token=` query param or an
 * `x-webhook-secret` header) that we compare — in constant time — against
 * ARKESEL_WEBHOOK_SECRET. If no secret is configured, all inbound calls are
 * rejected (fail closed).
 */
@injectable()
export class ArkeselWebhookVerifier implements IInboundSmsVerifier {
  private readonly secret: string | null;

  constructor(@inject(TOKENS.Env) env: Env) {
    this.secret = env.ARKESEL_WEBHOOK_SECRET?.trim() || null;
  }

  verify(secret: string | undefined): boolean {
    if (!this.secret || !secret) return false;
    const a = Buffer.from(secret);
    const b = Buffer.from(this.secret);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
