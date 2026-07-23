import { SUBSCRIPTION_PLANS } from '@back2u/shared-types';
import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  DecideInstitutionLeadUseCase,
  GetInstitutionUseCase,
  ListInstitutionLeadsUseCase,
  ListInstitutionsUseCase,
  OnboardInstitutionUseCase,
  SubmitInstitutionLeadUseCase,
  SubscribeInstitutionUseCase,
} from '../../../application/use-cases/institution/institution.use-cases.js';
import { ListRewardPartnersUseCase } from '../../../application/use-cases/rewards/list-reward-partners.use-case.js';
import { ForbiddenError } from '../../../domain/shared/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const InstitutionTypeSchema = z.enum([
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
]);

const OnboardSchema = z.object({
  name: z.string().min(1),
  type: InstitutionTypeSchema,
  contactEmail: z.string().email(),
  place: z.object({
    name: z.string().min(1),
    lng: z.number(),
    lat: z.number(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
  pointsRedeemable: z.boolean().optional(),
  pointToCurrencyRate: z.number().positive().optional(),
  webhookUrl: z.string().url().optional(),
});

const LeadSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  city: z.string().min(1),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  estimatedVolume: z.string().optional(),
  message: z.string().optional(),
});

const DecideLeadSchema = z.object({
  decision: z.enum(['contacted', 'approved', 'rejected']),
});

const SubscribeSchema = z.object({
  tier: z.enum(['free', 'pro', 'enterprise']),
});

const ADMIN_ROLES = ['admin', 'super_admin'] as const;

export const institutionsRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', async (_req, res, next) => {
    try {
      const data = await c.get(ListInstitutionsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/plans', (_req, res) => {
    ok(res, SUBSCRIPTION_PLANS);
  });

  r.get('/rewards/partners', async (req, res, next) => {
    try {
      const category = req.query.category as string | undefined;
      const data = await c.get(ListRewardPartnersUseCase).execute(category);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), requireRole(...ADMIN_ROLES), async (req, res, next) => {
    try {
      const input = OnboardSchema.parse(req.body);
      const data = await c.get(OnboardInstitutionUseCase).execute(input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  // Self-serve "partner with us" lead capture — intentionally public.
  r.post('/leads', async (req, res, next) => {
    try {
      const input = LeadSchema.parse(req.body);
      const data = await c.get(SubmitInstitutionLeadUseCase).execute(input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/leads', requireAuth(c), requireRole(...ADMIN_ROLES), async (_req, res, next) => {
    try {
      const data = await c.get(ListInstitutionLeadsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post(
    '/leads/:id/decide',
    requireAuth(c),
    requireRole(...ADMIN_ROLES),
    async (req, res, next) => {
      try {
        const input = DecideLeadSchema.parse(req.body);
        const data = await c
          .get(DecideInstitutionLeadUseCase)
          .execute(req.params.id as string, input.decision);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  r.post('/:id/subscribe', requireAuth(c), async (req, res, next) => {
    try {
      const institutionId = req.params.id as string;
      const auth = req.auth!;
      const isAdmin = auth.roles.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
      const isOwnPartner =
        auth.roles.includes('partner_admin') && auth.institutionId === institutionId;
      if (!isAdmin && !isOwnPartner) throw new ForbiddenError();
      const input = SubscribeSchema.parse(req.body);
      const data = await c.get(SubscribeInstitutionUseCase).execute(institutionId, input.tier);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', async (req, res, next) => {
    try {
      const data = await c.get(GetInstitutionUseCase).execute(req.params.id as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
