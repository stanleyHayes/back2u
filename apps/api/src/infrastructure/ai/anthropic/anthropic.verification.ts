import { inject, injectable } from 'inversify';

import type { IAiVerificationService, IErrorReporter, ILogger } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

const VERIFICATION_MODEL = 'claude-3-5-haiku-20241022';

@injectable()
export class AnthropicVerificationService implements IAiVerificationService {
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

  async scoreClaimConsistency(input: {
    item: { title: string; description: string; tags: string[] };
    answers: { questionId: string; prompt: string; answer: string }[];
    proofs: { kind: string; text?: string; url?: string }[];
  }): Promise<{ score: number; reasoning: string }> {
    const client = await this.getAnthropic();
    if (!client) {
      this.logger.warn('ANTHROPIC_API_KEY not set — verification scoring degraded');
      return { score: 0.5, reasoning: 'AI verification unavailable; manual review required.' };
    }
    try {
      const res = await client.messages.create({
        model: VERIFICATION_MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content:
              'You verify ownership claims for a lost-and-found platform. Score how consistent the claimant answers and proofs are with the item. ' +
              'Respond with ONLY JSON: {"score": number between 0 and 1, "reasoning": string (2-3 sentences)}.\n\n' +
              JSON.stringify({
                item: input.item,
                answers: input.answers.map(({ prompt, answer }) => ({ prompt, answer })),
                proofs: input.proofs,
              }),
          },
        ],
      });
      const text = res.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('');
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      const parsed = JSON.parse(text.slice(start, end + 1)) as { score?: unknown; reasoning?: unknown };
      const raw = typeof parsed.score === 'number' ? parsed.score : 0.5;
      const score = Math.min(1, Math.max(0, raw));
      return {
        score,
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      };
    } catch (err) {
      this.logger.warn('ai verification scoring failed', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), {
        channel: 'ai.verification',
      });
      return { score: 0.5, reasoning: 'AI verification unavailable; manual review required.' };
    }
  }
}
