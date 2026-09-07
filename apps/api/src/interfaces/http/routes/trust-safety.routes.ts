import { Router } from 'express';
import type { Container } from 'inversify';
import { POINT_ACTIONS } from '@back2u/shared-types';
import { z } from 'zod';

import { UpdateBusinessRulesUseCase } from '../../../application/use-cases/admin/business-rules.use-cases.js';
import { GetBusinessRulesUseCase } from '../../../application/use-cases/admin/business-rules.use-cases.js';
import {
  AdjustPointsUseCase,
  ReversePointsUseCase,
} from '../../../application/use-cases/points/points.use-cases.js';
import {
  GetPartnerTrustSummaryUseCase,
  SetPartnerStandingUseCase,
} from '../../../application/use-cases/custody/partner-network.use-cases.js';
import {
  GetRiskAssessmentUseCase,
  ListOpenRiskAssessmentsUseCase,
  ReviewRiskAssessmentUseCase,
} from '../../../application/use-cases/risk/risk.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok, param, parsePagination } from './_helpers.js';

/**
 * A points slice. Keys are constrained to the known actions so a typo cannot
 * silently add a dead entry to the stored economy; `.partial()` keeps a PATCH
 * of one action valid.
 */
const PointsPerActionSchema = z
  .object(
    Object.fromEntries(
      POINT_ACTIONS.map((a) => [a, z.number().int().min(0).max(100_000)]),
    ) as Record<(typeof POINT_ACTIONS)[number], z.ZodNumber>,
  )
  .partial()
  // Reject rather than silently strip: a misspelled action would otherwise
  // look like a successful retune that changed nothing.
  .strict();

/** A multiplier slice: `z.record` over an enum key would demand every level. */
const VerificationMultipliersSchema = z
  .object({
    peer: z.number().min(0).max(10),
    recovery_point: z.number().min(0).max(10),
    verified_delivery: z.number().min(0).max(10),
    institutional: z.number().min(0).max(10),
  })
  .partial()
  .strict();

const UpdateBusinessRulesSchema = z
  .object({
    pointsPerAction: PointsPerActionSchema.optional(),
    // Category slugs are free-form, so only the values are constrained here.
    categoryBonus: z.record(z.string(), z.number().int().min(0).max(100_000)).optional(),
    pointsPendingDays: z.number().int().min(0).max(365).optional(),
    riskExtendedPendingDays: z.number().int().min(0).max(365).optional(),
    dailyPointCap: z.number().int().min(0).optional(),
    weeklyPointCap: z.number().int().min(0).optional(),
    monthlyPointCap: z.number().int().min(0).optional(),
    verificationMultipliers: VerificationMultipliersSchema.optional(),
    repeatPairFreeCount: z.number().int().min(0).optional(),
    repeatPairPenalty: z.number().min(0).max(1).optional(),
    diminishingReturnsAfter: z.number().int().min(0).optional(),
    diminishingReturnsFactor: z.number().min(0).max(1).optional(),
    newAccountMinAgeDays: z.number().int().min(0).max(365).optional(),
    newAccountRewardDelayDays: z.number().int().min(0).max(365).optional(),
    highValueThresholdMinor: z.number().int().min(0).optional(),
    riskThresholds: z
      .object({
        mediumFrom: z.number().int().min(1).max(100),
        highFrom: z.number().int().min(1).max(100),
        criticalFrom: z.number().int().min(1).max(100),
      })
      .partial()
      .optional(),
    rewardPlatformFeeRate: z.number().min(0).max(1).optional(),
    campaignMultiplier: z.number().min(0).max(10).optional(),
    campaignStartsAt: z.string().datetime().nullish(),
    campaignEndsAt: z.string().datetime().nullish(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'No changes supplied' });

const ReviewRiskSchema = z.object({
  decision: z.enum(['cleared', 'confirmed_fraud', 'dismissed']),
  note: z.string().max(2000).optional(),
});

const ReversePointsSchema = z.object({ note: z.string().min(1).max(2000) });

const SetPartnerStandingSchema = z
  .object({
    tier: z
      .enum([
        'community',
        'recovery_point',
        'verified_recovery_point',
        'institutional',
        'transport',
        'logistics',
        'reward',
        'sponsor',
        'government',
      ])
      .optional(),
    trustStatus: z.enum(['active', 'watchlist', 'reward_hold', 'suspended']).optional(),
    note: z.string().max(2000).optional(),
  })
  .refine((v) => v.tier !== undefined || v.trustStatus !== undefined, {
    message: 'Supply a tier, a trustStatus, or both',
  });

const AdjustPointsSchema = z.object({
  userId: z.string().min(1),
  points: z.number().int(),
  note: z.string().min(1).max(2000),
});

/**
 * The Trust & Safety command centre of spec §17 and the editable economics of
 * §18. Admin-only throughout — these payloads carry the private Recovery Risk
 * Scores and the rule weights behind them.
 */
export const trustSafetyRouter = (c: Container): Router => {
  const r = Router();
  const admin = [requireAuth(c), requireRole('admin', 'super_admin')] as const;

  r.get('/business-rules', ...admin, async (_req, res, next) => {
    try {
      ok(res, await c.get(GetBusinessRulesUseCase).execute());
    } catch (e) {
      next(e);
    }
  });

  r.patch('/business-rules', ...admin, async (req, res, next) => {
    try {
      const input = UpdateBusinessRulesSchema.parse(req.body);
      const data = await c.get(UpdateBusinessRulesUseCase).execute(
        {
          ...input,
          campaignStartsAt: input.campaignStartsAt ?? undefined,
          campaignEndsAt: input.campaignEndsAt ?? undefined,
        },
        req.auth!.sub,
      );
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/risk', ...admin, async (req, res, next) => {
    try {
      const { pageSize, skip } = parsePagination(req, 20, 100);
      ok(res, await c.get(ListOpenRiskAssessmentsUseCase).execute({ limit: pageSize, skip }));
    } catch (e) {
      next(e);
    }
  });

  r.get('/risk/:id', ...admin, async (req, res, next) => {
    try {
      ok(res, await c.get(GetRiskAssessmentUseCase).execute(param(req, 'id')));
    } catch (e) {
      next(e);
    }
  });

  r.post('/risk/:id/review', ...admin, async (req, res, next) => {
    try {
      const input = ReviewRiskSchema.parse(req.body);
      const data = await c
        .get(ReviewRiskAssessmentUseCase)
        .execute(param(req, 'id'), req.auth!.sub, input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/partners/:id', ...admin, async (req, res, next) => {
    try {
      ok(res, await c.get(GetPartnerTrustSummaryUseCase).execute(param(req, 'id')));
    } catch (e) {
      next(e);
    }
  });

  r.patch('/partners/:id/standing', ...admin, async (req, res, next) => {
    try {
      const input = SetPartnerStandingSchema.parse(req.body);
      const data = await c
        .get(SetPartnerStandingUseCase)
        .execute(param(req, 'id'), input, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/points/adjust', ...admin, async (req, res, next) => {
    try {
      const input = AdjustPointsSchema.parse(req.body);
      ok(res, await c.get(AdjustPointsUseCase).execute(input, req.auth!.sub), 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/points/:id/reverse', ...admin, async (req, res, next) => {
    try {
      const { note } = ReversePointsSchema.parse(req.body);
      const data = await c.get(ReversePointsUseCase).execute(param(req, 'id'), req.auth!.sub, note);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
