import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ConfirmRedemptionUseCase,
  CreateRedemptionUseCase,
  ListInstitutionRedemptionsUseCase,
  ListMyRedemptionsUseCase,
} from '../../../application/use-cases/redemption/redemption.use-cases.js';
import { ForbiddenError } from '../../../domain/shared/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok, param } from './_helpers.js';

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
        const isStaff = req.auth!.roles.some((role) => role === 'admin' || role === 'super_admin');
        // The use case treats a missing institutionId as "no scope to check", so
        // a partner_admin whose token carries no organisation would be able to
        // confirm any partner's voucher.
        if (!isStaff && !req.auth!.institutionId) {
          throw new ForbiddenError('Your account is not linked to a partner organisation');
        }
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
        const institutionId = param(req, 'id');
        // A partner_admin is scoped to their own organisation; without this a
        // partner could read any other institution's redemption history.
        const isStaff = req.auth!.roles.some((role) => role === 'admin' || role === 'super_admin');
        if (!isStaff && institutionId !== req.auth!.institutionId) {
          throw new ForbiddenError('Redemptions belong to another institution');
        }
        const data = await c.get(ListInstitutionRedemptionsUseCase).execute(institutionId);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  return r;
};
