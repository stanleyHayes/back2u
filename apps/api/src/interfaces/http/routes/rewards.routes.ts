import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { ForbiddenError } from '../../../domain/shared/errors.js';
import { ReleaseRewardUseCase } from '../../../application/use-cases/reward/release-reward.js';
import { ListRewardPartnersUseCase } from '../../../application/use-cases/rewards/list-reward-partners.use-case.js';
import { UpdateRewardsProfileUseCase } from '../../../application/use-cases/rewards/update-rewards-profile.use-case.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const ReleaseSchema = z.object({
  finderId: z.string().min(1),
});

const RewardsProfileSchema = z.object({
  rewardsListed: z.boolean().optional(),
  pointsRedeemable: z.boolean().optional(),
  pointToCurrencyRate: z.number().positive().optional(),
  type: z
    .enum([
      'school',
      'airport',
      'transport',
      'event',
      'mall',
      'restaurant',
      'cafe',
      'retail',
      'pharmacy',
      'hotel',
      'other',
    ])
    .optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
});

export const rewardsRouter = (c: Container): Router => {
  const r = Router();

  r.get('/partners', async (req, res, next) => {
    try {
      const raw = typeof req.query.category === 'string' ? req.query.category : undefined;
      const category = raw && raw !== 'all' ? raw : undefined;
      const data = await c.get(ListRewardPartnersUseCase).execute(category);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch(
    '/profile',
    requireAuth(c),
    requireRole('partner_admin', 'admin', 'super_admin'),
    async (req, res, next) => {
      try {
        const institutionId = req.auth!.institutionId;
        if (!institutionId) throw new ForbiddenError('User not linked to an institution');
        const input = RewardsProfileSchema.parse(req.body);
        const data = await c.get(UpdateRewardsProfileUseCase).execute(institutionId, input);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  r.post('/:id/release', requireAuth(c), async (req, res, next) => {
    try {
      const { finderId } = ReleaseSchema.parse(req.body);
      const data = await c
        .get(ReleaseRewardUseCase)
        .execute(req.params.id as string, req.auth!.sub, finderId);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
