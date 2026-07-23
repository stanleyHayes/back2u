import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  CreateReviewUseCase,
  GetMyReviewForMatchUseCase,
  ListReviewsForUserUseCase,
} from '../../../application/use-cases/review/review.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const CreateReviewSchema = z.object({
  matchId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewRouter = (c: Container): Router => {
  const r = Router();

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateReviewSchema.parse(req.body);
      const data = await c.get(CreateReviewUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/user/:id', async (req, res, next) => {
    try {
      const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
      const data = await c.get(ListReviewsForUserUseCase).execute(req.params.id as string, limit);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/match/:id/mine', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(GetMyReviewForMatchUseCase).execute(req.auth!.sub, req.params.id as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
