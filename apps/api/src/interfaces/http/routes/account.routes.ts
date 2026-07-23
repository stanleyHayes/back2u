import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ComprehensiveExportUseCase,
  DeleteAccountUseCase,
} from '../../../application/use-cases/account/account.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const DeleteAccountSchema = z.object({
  acknowledge: z.literal(true),
});

export const accountRouter = (c: Container): Router => {
  const r = Router();

  r.use(requireAuth(c));

  r.get('/export', async (req, res, next) => {
    try {
      const data = await c.get(ComprehensiveExportUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/', async (req, res, next) => {
    try {
      DeleteAccountSchema.parse(req.body);
      await c.get(DeleteAccountUseCase).execute(req.auth!.sub);
      ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
