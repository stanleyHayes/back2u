import { Router, type Request } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { LoginUserUseCase } from '../../../application/use-cases/auth/login-user.js';
import { RegisterUserUseCase, toUserDTO } from '../../../application/use-cases/auth/register-user.js';
import { LogoutUseCase, RefreshSessionUseCase } from '../../../application/use-cases/auth/refresh-session.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { IUserRepository } from '../../../application/ports/repositories.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRouter = (c: Container): Router => {
  const r = Router();

  const meta = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') });

  r.post('/register', async (req, res, next) => {
    try {
      const input = RegisterSchema.parse(req.body);
      const data = await c.get(RegisterUserUseCase).execute(input, meta(req));
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/login', async (req, res, next) => {
    try {
      const input = LoginSchema.parse(req.body);
      const data = await c.get(LoginUserUseCase).execute(input, meta(req));
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/refresh', async (req, res, next) => {
    try {
      const { refreshToken } = RefreshSchema.parse(req.body);
      const data = await c.get(RefreshSessionUseCase).execute(refreshToken, meta(req));
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/logout', async (req, res, next) => {
    try {
      const { refreshToken } = RefreshSchema.parse(req.body);
      const data = await c.get(LogoutUseCase).execute(refreshToken);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/me', requireAuth(c), async (req, res, next) => {
    try {
      const users = c.get<IUserRepository>(TOKENS.UserRepository);
      const user = await users.findById(req.auth!.sub);
      if (!user) throw new NotFoundError('User');
      ok(res, toUserDTO(user));
    } catch (e) {
      next(e);
    }
  });

  return r;
};
