import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ListModerationQueueUseCase,
  ReviewModerationItemUseCase,
} from '../../../application/use-cases/moderation/moderation.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const QueueQuerySchema = z.object({
  type: z.enum(['item', 'message', 'user']).optional(),
  status: z.enum(['pending', 'reviewed']).optional(),
});

const ReviewSchema = z.object({
  decision: z.enum(['approve', 'remove']),
});

export const moderationRouter = (c: Container): Router => {
  const r = Router();

  r.get('/queue', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const filter = QueueQuerySchema.parse(req.query);
      const data = await c.get(ListModerationQueueUseCase).execute(filter);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/review', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const input = ReviewSchema.parse(req.body);
      const data = await c
        .get(ReviewModerationItemUseCase)
        .execute(req.auth!.sub, req.params.id as string, input.decision);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
