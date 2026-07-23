import { Router } from 'express';
import type { Container } from 'inversify';

import { GetAdminStatsUseCase } from '../../../application/use-cases/admin/get-admin-stats.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

export const adminRouter = (c: Container): Router => {
  const r = Router();

  r.get('/stats', requireAuth(c), requireRole('admin'), async (req, res, next) => {
    try {
      const data = await c.get(GetAdminStatsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
