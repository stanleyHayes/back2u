import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  CreateRewardOfferUseCase,
  GetPartnerRewardAnalyticsUseCase,
  ListPartnerRewardOffersUseCase,
  ListRewardCatalogUseCase,
  ReserveRewardUseCase,
  UpdateRewardOfferUseCase,
} from '../../../application/use-cases/reward_catalog/reward-catalog.use-cases.js';
import { ForbiddenError } from '../../../domain/shared/errors.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { ok, param, parsePagination } from './_helpers.js';

const CATEGORIES = [
  'mobile_data',
  'ride_credit',
  'delivery_discount',
  'restaurant_voucher',
  'retail_discount',
  'event_perk',
  'insurance_benefit',
  'merchandise',
] as const;

const TRUST_LEVELS = [
  'new_finder',
  'helper',
  'trusted_finder',
  'community_hero',
  'guardian',
  'legend',
] as const;

const OfferFields = {
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(2000),
  category: z.enum(CATEGORIES),
  pointsCost: z.number().int().min(1).max(1_000_000),
  imageUrl: z.string().url().optional(),
  // `null` is meaningful: it clears a cap back to unlimited.
  totalInventory: z.number().int().min(0).max(1_000_000).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  perUserLimit: z.number().int().min(1).max(1000).nullable().optional(),
  minTrustLevel: z.enum(TRUST_LEVELS).optional(),
  reservationHours: z.number().int().min(1).max(720).optional(),
  termsUrl: z.string().url().optional(),
};

const CreateOfferSchema = z.object(OfferFields).strict();

const UpdateOfferSchema = z
  .object({ ...OfferFields, status: z.enum(['draft', 'live', 'paused', 'ended']) })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'No changes supplied' });

function callerInstitution(req: { auth?: { institutionId?: string } }): string {
  const institutionId = req.auth?.institutionId;
  if (!institutionId) {
    throw new ForbiddenError('Your account is not linked to a partner organisation');
  }
  return institutionId;
}

/**
 * The rewards marketplace (spec §13): partner-funded benefits members spend
 * BakPoints on, deliberately not a points-to-cash channel.
 */
export const rewardsCatalogRouter = (c: Container): Router => {
  const r = Router();

  /** Browsable signed-out; eligibility is only resolved for a signed-in member. */
  r.get('/', optionalAuth(c), async (req, res, next) => {
    try {
      const { pageSize, skip } = parsePagination(req, 24, 60);
      const institutionId =
        typeof req.query.institutionId === 'string' ? req.query.institutionId : undefined;
      const data = await c
        .get(ListRewardCatalogUseCase)
        .execute(req.auth?.sub, { limit: pageSize, skip, institutionId });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/reserve', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ReserveRewardUseCase).execute(req.auth!.sub, param(req, 'id'));
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  // ── Partner catalogue management ────────────────────────────────────────
  const partner = [requireAuth(c), requireRole('partner_admin', 'admin', 'super_admin')] as const;

  r.get('/manage', ...partner, async (req, res, next) => {
    try {
      ok(res, await c.get(ListPartnerRewardOffersUseCase).execute(callerInstitution(req)));
    } catch (e) {
      next(e);
    }
  });

  r.post('/manage', ...partner, async (req, res, next) => {
    try {
      const input = CreateOfferSchema.parse(req.body);
      const data = await c
        .get(CreateRewardOfferUseCase)
        .execute(callerInstitution(req), input, req.auth!.sub);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/manage/:id', ...partner, async (req, res, next) => {
    try {
      const input = UpdateOfferSchema.parse(req.body);
      const data = await c
        .get(UpdateRewardOfferUseCase)
        .execute(callerInstitution(req), param(req, 'id'), input, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/manage/analytics', ...partner, async (req, res, next) => {
    try {
      ok(res, await c.get(GetPartnerRewardAnalyticsUseCase).execute(callerInstitution(req)));
    } catch (e) {
      next(e);
    }
  });

  return r;
};
