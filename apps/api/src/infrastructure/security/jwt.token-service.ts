import { randomBytes } from 'node:crypto';

import { inject, injectable } from 'inversify';
import jwt, { type SignOptions } from 'jsonwebtoken';

import type {
  AccessTokenClaims,
  ITokenService,
} from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

@injectable()
export class JwtTokenService implements ITokenService {
  constructor(@inject(TOKENS.Env) private readonly env: Env) {}

  signAccess(claims: AccessTokenClaims) {
    const opts: SignOptions = { expiresIn: this.env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
    const token = jwt.sign({ ...claims, typ: 'access' }, this.env.JWT_ACCESS_SECRET, opts);
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);
    return { token, expiresAt };
  }

  signRefresh(sub: string) {
    const opts: SignOptions = { expiresIn: this.env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
    // jti guarantees uniqueness: two tokens issued for the same user within the
    // same second would otherwise be identical and collide on the tokenHash index.
    const token = jwt.sign({ sub, jti: randomBytes(16).toString('hex') }, this.env.JWT_REFRESH_SECRET, opts);
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 86_400_000);
    return { token, expiresAt };
  }

  signShortLived(payload: Record<string, unknown>, ttlSeconds: number): string {
    return jwt.sign({ ...payload, typ: 'short' }, this.env.JWT_ACCESS_SECRET, { expiresIn: ttlSeconds });
  }

  verifyAccess(token: string): AccessTokenClaims {
    const claims = jwt.verify(token, this.env.JWT_ACCESS_SECRET) as AccessTokenClaims & { typ?: string };
    // Short-lived tokens share the access secret; reject them here so they can
    // never be confused with (or replayed as) a full access token.
    if (claims.typ !== 'access') throw new Error('invalid token type');
    return claims;
  }
  verifyRefresh(token: string): { sub: string } {
    return jwt.verify(token, this.env.JWT_REFRESH_SECRET) as { sub: string };
  }
  verifyShortLived<T = Record<string, unknown>>(token: string): T {
    const claims = jwt.verify(token, this.env.JWT_ACCESS_SECRET) as T & { typ?: string };
    if ((claims as { typ?: string }).typ !== 'short') throw new Error('invalid token type');
    return claims;
  }
}
