import type { NextFunction, Request, Response } from 'express';
import type { Container } from 'inversify';

import { ForbiddenError } from '../../../domain/shared/errors.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';
import type { IUserRepository } from '../../../application/ports/repositories.js';

export function requireVerifiedEmail(container: Container) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const env = container.get<Env>(TOKENS.Env);
    if (!env.REQUIRE_VERIFIED_EMAIL) return next();
    if (!req.auth) return next();

    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const user = await users.findById(req.auth.sub);
    if (!user?.snapshot.emailVerified) {
      return next(new ForbiddenError('Email verification required'));
    }
    next();
  };
}
