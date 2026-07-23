import { inject, injectable } from 'inversify';

import { ValidationError } from '../../../domain/shared/errors.js';
import type { ITextGenerationService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

export interface DescribedImage {
  title: string;
  description: string;
  tags: string[];
}

@injectable()
export class DescribeImageUseCase {
  constructor(
    @inject(TOKENS.TextGenerationService) private readonly llm: ITextGenerationService,
  ) {}

  async execute(input: { imageUrl: string }): Promise<DescribedImage> {
    const raw = await this.llm.generate({
      system:
        'You describe photos of lost or found items for a lost-and-found platform. ' +
        'Respond with JSON only: {"title": string (max 60 chars), "description": string (max 500 chars), "tags": string[] (max 8, lowercase)}.',
      user: `Describe the item visible in this photo: ${input.imageUrl}`,
      maxTokens: 400,
    });

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new ValidationError('AI did not return a structured description');
    let parsed: Partial<DescribedImage>;
    try {
      parsed = JSON.parse(match[0]) as Partial<DescribedImage>;
    } catch {
      throw new ValidationError('AI did not return a structured description');
    }
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description: typeof parsed.description === 'string' ? parsed.description : raw.trim(),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t): t is string => typeof t === 'string')
        : [],
    };
  }
}
