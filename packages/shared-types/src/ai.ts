/** Writing-assistant operations available across the apps. */
export type AiAssistAction =
  | 'formalize'
  | 'summarize'
  | 'make_casual'
  | 'expand'
  | 'fix_grammar'
  | 'improve_clarity'
  | 'generate_title'
  | 'generate_message'
  | 'create_from_prompt'
  | 'translate';

export interface AiAssistInput {
  action: AiAssistAction;
  /** The selected or full text the action operates on. Optional for create_from_prompt. */
  text?: string;
  /** Free-form instruction for create_from_prompt / generate_message. */
  prompt?: string;
  /** Optional surrounding context (e.g. the body when generating a title). */
  context?: string;
  /** Optional tone hint (e.g. "warm", "professional"). */
  tone?: string;
  /** Target language for the translate action (e.g. "French", "Twi", "Ga"). */
  language?: string;
}

export interface AiAssistResult {
  action: AiAssistAction;
  text: string;
}
