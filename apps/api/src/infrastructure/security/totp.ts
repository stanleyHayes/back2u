import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Minimal RFC 6238 TOTP implementation (HMAC-SHA1, 6 digits, 30s steps) —
 * the profile used by Google Authenticator, Authy, 1Password, etc.
 * Implemented on node:crypto so no third-party dependency is needed.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Generates a new random base32 TOTP secret (160 bits per RFC 4226). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function hotp(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(msg).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;
  return String(code % 1_000_000).padStart(6, '0');
}

export function totpCode(secretBase32: string, atMs = Date.now(), stepSeconds = 30): string {
  return hotp(base32Decode(secretBase32), Math.floor(atMs / 1000 / stepSeconds));
}

/**
 * Returns the time step a 6-digit TOTP code matches (accepting ±`window`
 * steps of clock drift, default one 30s step either side), or null when it
 * matches none. Callers should persist the accepted step and reject codes at
 * or below it, so a code can never be replayed within the drift window
 * (RFC 6238 §5.2).
 */
export function totpMatchStep(secretBase32: string, code: string, window = 1): number | null {
  const normalized = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) return null;
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / 30);
  const given = Buffer.from(normalized);
  for (let i = -window; i <= window; i++) {
    const expected = Buffer.from(hotp(key, counter + i));
    if (expected.length === given.length && timingSafeEqual(expected, given)) return counter + i;
  }
  return null;
}

/** Verifies a 6-digit TOTP code (see totpMatchStep for the drift window). */
export function verifyTotp(secretBase32: string, code: string, window = 1): boolean {
  return totpMatchStep(secretBase32, code, window) !== null;
}

/** Builds the otpauth:// URL that authenticator apps read from a QR code. */
export function otpauthUrl(opts: { secret: string; accountName: string; issuer?: string }): string {
  const issuer = opts.issuer ?? 'Back2u';
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(opts.accountName)}`;
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
