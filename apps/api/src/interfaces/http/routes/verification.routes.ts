import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  DecideVerificationUseCase,
  GetVerificationQuestionsUseCase,
  ListPendingVerificationsUseCase,
  SubmitVerificationUseCase,
} from '../../../application/use-cases/verification/verification.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const SubmitSchema = z.object({
  itemId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), answer: z.string().min(1).max(2000) })).min(1),
  proofs: z
    .array(
      z.object({
        kind: z.enum(['receipt', 'imei', 'serial', 'old_photo', 'other']),
        url: z.string().url().optional(),
        text: z.string().max(2000).optional(),
      }),
    )
    .max(10)
    .default([]),
});

const DecideSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(2000).optional(),
});

export const verificationRouter = (c: Container): Router => {
  const r = Router();

  r.get('/questions', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(GetVerificationQuestionsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const input = SubmitSchema.parse(req.body);
      const data = await c.get(SubmitVerificationUseCase).execute(req.auth!.sub, {
        itemId: input.itemId,
        answers: input.answers,
        proofs: input.proofs,
      });
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/pending', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const data = await c.get(ListPendingVerificationsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/decide', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const input = DecideSchema.parse(req.body);
      const data = await c
        .get(DecideVerificationUseCase)
        .execute(req.params.id as string, req.auth!.sub, input.decision, input.note);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
