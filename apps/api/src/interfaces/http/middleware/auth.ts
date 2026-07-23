import type { NextFunction, Request, Response } from 'express';
import type { Container } from 'inversify';
import type { UserRole } from '@back2u/shared-types';

import { ForbiddenError, UnauthorizedError } from '../../../domain/shared/errors.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { AccessTokenClaims, ITokenService } from '../../../application/ports/services.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenClaims;
    }
  }
}

function bearerToken(req: Request): string | null {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export function requireAuth(container: Container) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = bearerToken(req);
      if (!token) throw new UnauthorizedError('Missing bearer token');
      const tokens = container.get<ITokenService>(TOKENS.TokenService);
      req.auth = tokens.verifyAccess(token);
      next();
    } catch (e) {
      next(e instanceof UnauthorizedError ? e : new UnauthorizedError('Invalid or expired token'));
    }
  };
}

export function optionalAuth(container: Container) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = bearerToken(req);
    if (token) {
      try {
        const tokens = container.get<ITokenService>(TOKENS.TokenService);
        req.auth = tokens.verifyAccess(token);
      } catch {
        // Treat a bad token as anonymous on optional routes.
      }
    }
    next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new UnauthorizedError());
    if (!req.auth.roles.some((r) => roles.includes(r))) {
      return next(new ForbiddenError('Insufficient role'));
    }
    next();
  };
}
