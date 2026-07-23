import { Router } from 'express';
import type { Container } from 'inversify';

import { AcceptMatchUseCase, RejectMatchUseCase } from '../../../application/use-cases/match/decide-match.js';
import { ConfirmItemReturnUseCase } from '../../../application/use-cases/match/confirm-item-return.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

export const matchesRouter = (c: Container): Router => {
  const r = Router();

  r.post('/:id/accept', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(AcceptMatchUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/reject', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(RejectMatchUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/confirm-return', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c
        .get(ConfirmItemReturnUseCase)
        .execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
