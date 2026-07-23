import type { AiAssistInput, AiAssistResult } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { ITextGenerationService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class AiAssistUseCase {
  constructor(
    @inject(TOKENS.TextGenerationService) private readonly llm: ITextGenerationService,
  ) {}

  async execute(input: AiAssistInput): Promise<AiAssistResult> {
    const text = await this.llm.generate({
      system:
        'You are a concise writing assistant for a lost-and-found platform. ' +
        'Return only the rewritten or generated text, with no commentary or quotes.',
      user: buildInstruction(input),
      maxTokens: 800,
    });
    return { action: input.action, text: text.trim() };
  }
}

function buildInstruction(input: AiAssistInput): string {
  const parts: string[] = [];
  switch (input.action) {
    case 'formalize':
      parts.push('Rewrite the text in a formal tone.');
      break;
    case 'summarize':
      parts.push('Summarize the text briefly.');
      break;
    case 'make_casual':
      parts.push('Rewrite the text in a casual, friendly tone.');
      break;
    case 'expand':
      parts.push('Expand the text with more relevant detail.');
      break;
    case 'fix_grammar':
      parts.push('Fix grammar and spelling without changing the meaning.');
      break;
    case 'improve_clarity':
      parts.push('Improve the clarity of the text.');
      break;
    case 'generate_title':
      parts.push('Generate a short, descriptive title for the text.');
      break;
    case 'generate_message':
      parts.push(input.prompt ? `Write a message: ${input.prompt}` : 'Write a message based on the context.');
      break;
    case 'create_from_prompt':
      parts.push(input.prompt ?? '');
      break;
    case 'translate':
      parts.push(`Translate the text to ${input.language ?? 'English'}.`);
      break;
  }
  if (input.tone) parts.push(`Tone: ${input.tone}.`);
  if (input.context) parts.push(`Context:\n${input.context}`);
  if (input.text) parts.push(`Text:\n${input.text}`);
  return parts.join('\n\n');
}
