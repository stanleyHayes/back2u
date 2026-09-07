import { randomBytes } from 'node:crypto';

/**
 * Human-transcribable alphabet: no I, O, 0 or 1, so a code read aloud at a
 * counter or copied off a printed label cannot be mistranscribed.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A random code drawn from {@link CODE_ALPHABET}. */
export function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}

/** A case reference a person can quote over the phone, e.g. `BAK-7Q4M2XKD`. */
export function generateCaseReference(): string {
  return `BAK-${generateCode(8)}`;
}
