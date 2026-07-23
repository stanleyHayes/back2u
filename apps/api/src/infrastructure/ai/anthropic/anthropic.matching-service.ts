import { inject, injectable } from 'inversify';

import type { IAiMatchingService, IErrorReporter, ILogger } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

type FeatureExtractor = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VISION_MODEL = 'claude-3-5-haiku-20241022';

@injectable()
export class AnthropicMatchingService implements IAiMatchingService {
  private extractorPromise: Promise<FeatureExtractor> | null = null;
  private anthropicPromise: Promise<
    import('@anthropic-ai/sdk').default | null
  > | null = null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.ErrorReporter) private readonly reporter: IErrorReporter,
  ) {}

  /** Lazy singleton: the model is downloaded/loaded on first use only. */
  private getExtractor(): Promise<FeatureExtractor> {
    this.extractorPromise ??= import('@xenova/transformers').then(
      ({ pipeline }) =>
        pipeline('feature-extraction', EMBEDDING_MODEL) as unknown as Promise<FeatureExtractor>,
    );
    return this.extractorPromise;
  }

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

  async embedText(text: string): Promise<number[]> {
    try {
      const extractor = await this.getExtractor();
      const out = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(out.data as Float32Array);
    } catch (err) {
      this.logger.warn('text embedding failed', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), {
        channel: 'ai.embedText',
      });
      return [];
    }
  }

  /** Image "embedding" = text embedding of a vision-generated description. */
  async embedImage(imageUrl: string): Promise<number[]> {
    const described = await this.describeImage(imageUrl);
    const text = [described.title, described.description, described.tags.join(' ')]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!text) return [];
    return this.embedText(text);
  }

  async describeImage(imageUrl: string): Promise<{ title: string; description: string; tags: string[] }> {
    const empty = { title: '', description: '', tags: [] as string[] };
    const client = await this.getAnthropic();
    if (!client) return empty;
    try {
      const res = await client.messages.create({
        model: VISION_MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: imageUrl } },
              {
                type: 'text',
                text: 'Describe this item for a lost-and-found marketplace. Respond with ONLY JSON: {"title": string, "description": string, "tags": string[]}.',
              },
            ],
          },
        ],
      });
      const text = res.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('');
      const parsed = JSON.parse(this.extractJson(text)) as {
        title?: unknown;
        description?: unknown;
        tags?: unknown;
      };
      return {
        title: typeof parsed.title === 'string' ? parsed.title : '',
        description: typeof parsed.description === 'string' ? parsed.description : '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === 'string') : [],
      };
    } catch (err) {
      this.logger.warn('image description failed', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), {
        channel: 'ai.describeImage',
      });
      return empty;
    }
  }

  cosine(a: number[], b: number[]): number {
    if (a.length === 0 || a.length !== b.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i]!;
      const y = b[i]!;
      dot += x * y;
      na += x * x;
      nb += y * y;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }

  private extractJson(text: string): string {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error('no JSON in model response');
    return text.slice(start, end + 1);
  }
}
