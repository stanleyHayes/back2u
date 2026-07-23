import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { GetPartnerStatsUseCase } from '../../../application/use-cases/admin/get-partner-stats.js';
import { UpdateRewardsProfileUseCase } from '../../../application/use-cases/rewards/update-rewards-profile.use-case.js';
import { ForbiddenError } from '../../../domain/shared/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const UpdateRewardsProfileSchema = z.object({
  rewardsListed: z.boolean().optional(),
  pointsRedeemable: z.boolean().optional(),
  pointToCurrencyRate: z.number().positive().optional(),
  type: z
    .enum(['school', 'airport', 'transport', 'event', 'mall', 'restaurant', 'cafe', 'retail', 'pharmacy', 'hotel', 'other'])
    .optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().or(z.literal('')).optional(),
});

export const partnerRouter = (c: Container): Router => {
  const r = Router();

  r.use(requireAuth(c), requireRole('partner_admin', 'admin', 'super_admin'));

  r.get('/stats', async (req, res, next) => {
    try {
      const institutionId = req.auth!.institutionId;
      if (!institutionId) throw new ForbiddenError('User not linked to an institution');
      const data = await c.get(GetPartnerStatsUseCase).execute(institutionId);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/rewards-profile', async (req, res, next) => {
    try {
      const institutionId = req.auth!.institutionId;
      if (!institutionId) throw new ForbiddenError('User not linked to an institution');
      const input = UpdateRewardsProfileSchema.parse(req.body);
      const data = await c.get(UpdateRewardsProfileUseCase).execute(institutionId, input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
