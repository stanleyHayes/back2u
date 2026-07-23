import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ConfirmRedemptionUseCase,
  CreateRedemptionUseCase,
  ListInstitutionRedemptionsUseCase,
  ListMyRedemptionsUseCase,
} from '../../../application/use-cases/redemption/redemption.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const CreateRedemptionSchema = z.object({
  institutionId: z.string().min(1),
  points: z.number().int().min(1),
});

const ConfirmRedemptionSchema = z.object({
  code: z.string().min(1),
});

export const redemptionsRouter = (c: Container): Router => {
  const r = Router();

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateRedemptionSchema.parse(req.body);
      const data = await c.get(CreateRedemptionUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/mine', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyRedemptionsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post(
    '/confirm',
    requireAuth(c),
    requireRole('partner_admin', 'admin', 'super_admin'),
    async (req, res, next) => {
      try {
        const { code } = ConfirmRedemptionSchema.parse(req.body);
        const data = await c
          .get(ConfirmRedemptionUseCase)
          .execute({ code, institutionId: req.auth!.institutionId });
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  r.get(
    '/institution/:id',
    requireAuth(c),
    requireRole('partner_admin', 'admin', 'super_admin'),
    async (req, res, next) => {
      try {
        const data = await c
          .get(ListInstitutionRedemptionsUseCase)
          .execute(req.params.id as string);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  return r;
};
