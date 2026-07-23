import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ConfirmEmailVerificationUseCase,
  RequestEmailVerificationUseCase,
} from '../../../application/use-cases/email_verify/email-verify.use-cases.js';
import { ChangePasswordUseCase } from '../../../application/use-cases/auth/mfa.use-cases.js';
import {
  ConfirmPasswordResetUseCase,
  RequestPasswordResetUseCase,
} from '../../../application/use-cases/password_reset/password-reset.use-cases.js';
import {
  RequestPhoneOtpUseCase,
  VerifyPhoneOtpUseCase,
} from '../../../application/use-cases/phone_otp/phone-otp.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const PhoneRequestSchema = z.object({
  phone: z.string().min(6),
});

const PhoneVerifySchema = z.object({
  phone: z.string().min(6),
  code: z.string().length(6),
});

const EmailConfirmSchema = z.object({
  code: z.string().length(6),
});

const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  // The caller's own refresh token — spared from the revoke-all so the
  // session that changed the password stays signed in.
  refreshToken: z.string().min(1).optional(),
});

export const authExtraRouter = (c: Container, resetPasswordUrl: string): Router => {
  const r = Router();

  r.post('/phone/request-otp', async (req, res, next) => {
    try {
      const { phone } = PhoneRequestSchema.parse(req.body);
      const data = await c.get(RequestPhoneOtpUseCase).execute(phone);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/phone/verify', async (req, res, next) => {
    try {
      const input = PhoneVerifySchema.parse(req.body);
      const data = await c.get(VerifyPhoneOtpUseCase).execute(input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/email/request-verification', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(RequestEmailVerificationUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/email/confirm', requireAuth(c), async (req, res, next) => {
    try {
      const { code } = EmailConfirmSchema.parse(req.body);
      const data = await c.get(ConfirmEmailVerificationUseCase).execute(req.auth!.sub, code);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/password/request-reset', async (req, res, next) => {
    try {
      const { email } = PasswordResetRequestSchema.parse(req.body);
      const data = await c
        .get(RequestPasswordResetUseCase)
        .execute({ email, resetUrlBase: resetPasswordUrl });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/password/change', requireAuth(c), async (req, res, next) => {
    try {
      const { currentPassword, newPassword, refreshToken } = PasswordChangeSchema.parse(req.body);
      const data = await c
        .get(ChangePasswordUseCase)
        .execute(req.auth!.sub, currentPassword, newPassword, refreshToken);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/password/confirm', async (req, res, next) => {
    try {
      const input = PasswordResetConfirmSchema.parse(req.body);
      const data = await c.get(ConfirmPasswordResetUseCase).execute(input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
