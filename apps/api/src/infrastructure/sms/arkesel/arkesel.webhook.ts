import { timingSafeEqual } from 'node:crypto';

import { inject, injectable } from 'inversify';

import type { IInboundSmsVerifier } from '../../../application/ports/extra-services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

/**
 * Verifies inbound Arkesel webhook calls via a shared secret compared in constant
 * time against ARKESEL_WEBHOOK_SECRET. If no secret is configured, all inbound
 * calls are rejected (fail closed).
 *
 * SECURITY NOTE: this is a deliberate but weaker control than Twilio's per-request
 * HMAC signature — Arkesel does not sign requests, so a static bearer secret is the
 * only option. Because a static secret is replayable and easily leaked (esp. via
 * URLs), defend in depth: prefer the `x-webhook-secret` header over `?token=`
 * (routes), never forward the secret into app logic (routes), only send billed SMS
 * replies for verified successful actions (use-case), and rate-limit / IP-allowlist
 * this route to Arkesel's servers at the edge.
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
