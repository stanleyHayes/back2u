import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { AiAssistUseCase } from '../../../application/use-cases/ai/ai-assist.use-case.js';
import { DescribeImageUseCase } from '../../../application/use-cases/ai_describe/describe-image.use-case.js';
import {
  ExportMyDataUseCase,
  RedeemPointsUseCase,
  RegisterPushTokenUseCase,
  SetLocaleUseCase,
  UpdateProfileUseCase,
} from '../../../application/use-cases/auth/me-extras.use-cases.js';
import {
  DisableMfaUseCase,
  EnableMfaUseCase,
  SetupMfaUseCase,
} from '../../../application/use-cases/auth/mfa.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const EmailPreferencesSchema = z.object({
  marketing: z.boolean().optional(),
  matches: z.boolean().optional(),
  chat: z.boolean().optional(),
  reminders: z.boolean().optional(),
  courier: z.boolean().optional(),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  emailPreferences: EmailPreferencesSchema.optional(),
});

const PushTokenSchema = z.object({
  token: z.string().min(1),
});

const MfaCodeSchema = z.object({
  code: z.string().min(6).max(7),
});

const LocaleSchema = z.object({
  locale: z.enum(['en', 'fr', 'tw', 'ga', 'ee']),
});

const RedeemSchema = z.object({
  points: z.number().int().positive(),
});

const DescribeImageSchema = z.object({
  imageUrl: z.string().url(),
});

const AiAssistSchema = z.object({
  action: z.enum([
    'formalize',
    'summarize',
    'make_casual',
    'expand',
    'fix_grammar',
    'improve_clarity',
    'generate_title',
    'generate_message',
    'create_from_prompt',
    'translate',
  ]),
  text: z.string().optional(),
  prompt: z.string().optional(),
  context: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
});

export const meExtrasRouter = (c: Container): Router => {
  const r = Router();

  r.use(requireAuth(c));

  r.patch('/', async (req, res, next) => {
    try {
      const input = UpdateProfileSchema.parse(req.body);
      const data = await c.get(UpdateProfileUseCase).execute(req.auth!.sub, input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/preferences', async (req, res, next) => {
    try {
      const emailPreferences = EmailPreferencesSchema.parse(req.body);
      const data = await c.get(UpdateProfileUseCase).execute(req.auth!.sub, { emailPreferences });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/mfa/setup', async (req, res, next) => {
    try {
      const data = await c.get(SetupMfaUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/mfa/enable', async (req, res, next) => {
    try {
      const { code } = MfaCodeSchema.parse(req.body);
      const data = await c.get(EnableMfaUseCase).execute(req.auth!.sub, code);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/mfa/disable', async (req, res, next) => {
    try {
      const { code } = MfaCodeSchema.parse(req.body);
      const data = await c.get(DisableMfaUseCase).execute(req.auth!.sub, code);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/push-token', async (req, res, next) => {
    try {
      const { token } = PushTokenSchema.parse(req.body);
      await c.get(RegisterPushTokenUseCase).execute(req.auth!.sub, token);
      ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/locale', async (req, res, next) => {
    try {
      const { locale } = LocaleSchema.parse(req.body);
      await c.get(SetLocaleUseCase).execute(req.auth!.sub, locale);
      ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/redeem', async (req, res, next) => {
    try {
      const { points } = RedeemSchema.parse(req.body);
      const data = await c.get(RedeemPointsUseCase).execute(req.auth!.sub, points);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/export', async (req, res, next) => {
    try {
      const data = await c.get(ExportMyDataUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/ai/describe-image', async (req, res, next) => {
    try {
      const { imageUrl } = DescribeImageSchema.parse(req.body);
      const data = await c.get(DescribeImageUseCase).execute({ imageUrl });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/ai/assist', async (req, res, next) => {
    try {
      const input = AiAssistSchema.parse(req.body);
      const data = await c.get(AiAssistUseCase).execute(input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
