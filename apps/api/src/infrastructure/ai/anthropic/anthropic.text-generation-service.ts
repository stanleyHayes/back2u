import { inject, injectable } from 'inversify';

import type {
  IErrorReporter,
  ILogger,
  ITextGenerationService,
  TextGenerationRequest,
} from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

const TEXT_MODEL = 'claude-3-5-haiku-20241022';

@injectable()
export class AnthropicTextGenerationService implements ITextGenerationService {
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

  async generate(req: TextGenerationRequest): Promise<string> {
    const client = await this.getAnthropic();
    if (!client) {
      this.logger.warn('ANTHROPIC_API_KEY not set — text generation disabled');
      return '';
    }
    try {
      const res = await client.messages.create({
        model: TEXT_MODEL,
        max_tokens: req.maxTokens ?? 1024,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
      });
      return res.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('')
        .trim();
    } catch (err) {
      this.logger.warn('text generation failed', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), {
        channel: 'ai.textGeneration',
      });
      return '';
    }
  }
}
