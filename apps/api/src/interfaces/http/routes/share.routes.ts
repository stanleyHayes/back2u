import { Router } from 'express';
import type { Container } from 'inversify';

import { GetShareCardUseCase } from '../../../application/use-cases/share/share-card.use-cases.js';
import { ok } from './_helpers.js';

export const shareRouter = (c: Container, apiPublicUrl: string): Router => {
  const r = Router();

  r.get('/items/:id/share-card', async (req, res, next) => {
    try {
      const data = await c
        .get(GetShareCardUseCase)
        .execute(req.params.id as string, apiPublicUrl);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
