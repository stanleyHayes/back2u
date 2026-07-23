import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ApplyTrustedFinderUseCase,
  DecideTrustedFinderApplicationUseCase,
  ListTrustedFinderApplicationsUseCase,
} from '../../../application/use-cases/trusted-finder/trusted-finder.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const ApplySchema = z.object({
  idPhotoUrl: z.string().url(),
  bio: z.string().max(1000).optional(),
});

const DecideSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(1000).optional(),
});

const StatusQuerySchema = z
  .object({ status: z.enum(['pending', 'approved', 'rejected']).optional() })
  .optional();

export const trustedFinderRouter = (c: Container): Router => {
  const r = Router();

  r.post('/apply', requireAuth(c), async (req, res, next) => {
    try {
      const input = ApplySchema.parse(req.body);
      const data = await c.get(ApplyTrustedFinderUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/applications', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const query = StatusQuerySchema.parse(req.query);
      const data = await c.get(ListTrustedFinderApplicationsUseCase).execute(query?.status);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/applications/:id/decide', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const input = DecideSchema.parse(req.body);
      const data = await c
        .get(DecideTrustedFinderApplicationUseCase)
        .execute(req.params.id as string, input.decision, input.reason);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
