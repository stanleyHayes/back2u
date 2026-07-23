import { inject, injectable } from 'inversify';

import type { IContentModeration, IErrorReporter, ILogger } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

const MODERATION_MODEL = 'claude-3-5-haiku-20241022';

const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/gi;
const URL_RE = /(?:https?:\/\/|www\.)\S+/gi;

const SCAM_PATTERNS = [
  /\b(western union|moneygram|gift ?cards?|wire transfer)\b/i,
  /\b(send (me )?money|advance fee|processing fee)\b/i,
  /\b(whatsapp|telegram)\s*(me)?\s*(at|on)?\s*\+?\d/i,
  /\b(otp|one[- ]time (code|password)|verification code)\b.*\b(send|share|give|tell)\b/i,
  /\b(i (will|can) pay you (double|extra)|overpay)\b/i,
];

function redactPii(body: string): { redacted: string; hits: string[] } {
  const hits: string[] = [];
  let redacted = body;
  for (const [re, label] of [
    [PHONE_RE, 'phone'],
    [EMAIL_RE, 'email'],
    [URL_RE, 'url'],
  ] as const) {
    if (re.test(redacted)) {
      hits.push(label);
      redacted = redacted.replace(re, `[${label} removed]`);
    }
  }
  return { redacted, hits };
}

@injectable()
export class AnthropicModeration implements IContentModeration {
  private anthropicPromise: Promise<import('@anthropic-ai/sdk').default | null> | null = null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.ErrorReporter) private readonly reporter: IErrorReporter,
  ) {}

  private getAnthropic(): Promise<import('@anthropic-ai/sdk').default | null> {
    if (!this.env.ANTHROPIC_API_KEY) return Promise.resolve(null);
    this.anthropicPromise ??= import('@anthropic-ai/sdk')
      .then(({ default: Anthropic }) => new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY }))
      .catch((err) => {
        this.logger.warn('anthropic sdk unavailable', { err: String(err) });
        return null;
      });
    return this.anthropicPromise;
  }

  async scoreMessage(body: string): Promise<{ flagged: boolean; reason?: string }> {
    const client = await this.getAnthropic();
    if (!client) return this.localScore(body);
    try {
      const res = await client.messages.create({
        model: MODERATION_MODEL,
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content:
              'You are a content moderator for a lost-and-found chat. Flag scams, fraud attempts, requests to move to other platforms, and shared personal contact info (phone/email/links). ' +
              'Respond with ONLY JSON: {"flagged": boolean, "reason": string}. Reason is a short lowercase phrase, empty when not flagged.\n\nMessage: ' +
              JSON.stringify(body),
          },
        ],
      });
      const text = res.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('');
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      const parsed = JSON.parse(text.slice(start, end + 1)) as { flagged?: unknown; reason?: unknown };
      const flagged = parsed.flagged === true;
      return {
        flagged,
        ...(flagged && typeof parsed.reason === 'string' && parsed.reason
          ? { reason: parsed.reason }
          : {}),
      };
    } catch (err) {
      this.logger.warn('ai moderation failed, using local fallback', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), {
        channel: 'ai.moderation',
      });
      return this.localScore(body);
    }
  }

  /** No-key fallback: permissive, but still redact PII-shaped content and catch obvious scams. */
  private localScore(body: string): { flagged: boolean; reason?: string } {
    const scam = SCAM_PATTERNS.find((re) => re.test(body));
    if (scam) return { flagged: true, reason: 'possible scam' };
    const { hits } = redactPii(body);
    if (hits.length > 0) return { flagged: true, reason: `contact info shared: ${hits.join(', ')}` };
    return { flagged: false };
  }
}
