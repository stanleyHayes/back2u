import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  GetFeatureFlagsUseCase,
  IsFeatureEnabledUseCase,
  SeedFeatureFlagsUseCase,
  ToggleFeatureFlagUseCase,
  UpdateRolloutUseCase,
} from '../../../application/use-cases/feature-flag/feature-flag.use-cases.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const RolloutSchema = z.object({
  rolloutPercentage: z.number().int().min(0).max(100),
  allowedUserIds: z.array(z.string()).optional(),
});

const SeedSchema = z.object({
  seeds: z
    .array(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        enabled: z.boolean().optional(),
        rolloutPercentage: z.number().min(0).max(100).optional(),
        allowedUserIds: z.array(z.string()).optional(),
      }),
    )
    .min(1),
});

export const featureFlagRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', optionalAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(GetFeatureFlagsUseCase).execute(req.auth?.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:key/enabled', optionalAuth(c), async (req, res, next) => {
    try {
      const enabled = await c.get(IsFeatureEnabledUseCase).execute(req.params.key as string, req.auth?.sub);
      ok(res, { enabled });
    } catch (e) {
      next(e);
    }
  });

  r.post('/seed', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const { seeds } = SeedSchema.parse(req.body);
      const data = await c.get(SeedFeatureFlagsUseCase).execute(seeds);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:key/toggle', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const data = await c.get(ToggleFeatureFlagUseCase).execute(req.params.key as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:key/rollout', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const input = RolloutSchema.parse(req.body);
      const data = await c.get(UpdateRolloutUseCase).execute(req.params.key as string, input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
