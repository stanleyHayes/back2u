import { describe, expect, it } from 'vitest';

import {
  base32Decode,
  base32Encode,
  generateTotpSecret,
  otpauthUrl,
  totpCode,
  verifyTotp,
} from '../../src/infrastructure/security/totp.js';

// RFC 4226 appendix D test secret: ASCII "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890', 'ascii'));

// RFC 4226 appendix D expected 6-digit HOTP codes for counters 0-9. TOTP with
// T = counter * 30s must produce exactly these.
const RFC_HOTP = [
  '755224',
  '287082',
  '359152',
  '969429',
  '338314',
  '254676',
  '287922',
  '162583',
  '399871',
  '520489',
];

describe('totp', () => {
  it('matches the RFC 4226 test vectors', () => {
    RFC_HOTP.forEach((expected, counter) => {
      expect(totpCode(RFC_SECRET, counter * 30_000)).toBe(expected);
    });
  });

  it('round-trips base32', () => {
    const buf = Buffer.from('12345678901234567890', 'ascii');
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
    expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  });

  it('verifies current codes and tolerates one step of drift', () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    expect(verifyTotp(secret, totpCode(secret, now))).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now - 30_000))).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now + 30_000))).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now - 120_000))).toBe(false);
  });

  it('rejects malformed codes', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '12345')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '')).toBe(false);
  });

  it('accepts codes with surrounding whitespace', () => {
    const secret = generateTotpSecret();
    const code = totpCode(secret);
    expect(verifyTotp(secret, ` ${code} `)).toBe(true);
  });

  it('builds a scannable otpauth URL', () => {
    const url = otpauthUrl({ secret: RFC_SECRET, accountName: 'admin@back2u.app' });
    expect(url).toContain('otpauth://totp/Back2u:admin%40back2u.app');
    expect(url).toContain(`secret=${RFC_SECRET}`);
    expect(url).toContain('issuer=Back2u');
    expect(url).toContain('digits=6');
  });
});
