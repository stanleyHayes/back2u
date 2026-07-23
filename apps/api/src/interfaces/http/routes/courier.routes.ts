import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  AcceptCourierJobUseCase,
  CalculateRouteUseCase,
  GetCourierJobUseCase,
  ListMyCourierJobsUseCase,
  ListNearbyCourierJobsUseCase,
  ListOpenCourierJobsUseCase,
  RequestCourierJobUseCase,
  TransitionCourierJobUseCase,
} from '../../../application/use-cases/courier/courier.use-cases.js';
import type { ICourierJobRepository } from '../../../application/ports/repositories.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const PlaceSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  point: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
});

const CreateJobSchema = z.object({
  itemId: z.string().min(1),
  pickup: PlaceSchema,
  dropoff: PlaceSchema,
  fee: z.number().int().min(0),
});

const TransitionSchema = z.object({
  transition: z.enum(['pickup', 'in_transit', 'deliver', 'cancel']),
  code: z.string().optional(),
});

const RouteSchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1),
  riderLng: z.number().optional(),
  riderLat: z.number().optional(),
});

const COURIER_ROLES = ['courier', 'partner_admin', 'admin', 'super_admin'] as const;

const parseNear = (query: unknown): { lng: number; lat: number; radiusMeters: number } | undefined => {
  const parsed = z
    .object({
      lng: z.coerce.number(),
      lat: z.coerce.number(),
      radius: z.coerce.number().int().positive().default(50_000),
    })
    .safeParse(query);
  if (!parsed.success) return undefined;
  return { lng: parsed.data.lng, lat: parsed.data.lat, radiusMeters: parsed.data.radius };
};

export const courierRouter = (c: Container): Router => {
  const r = Router();

  r.post('/jobs', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateJobSchema.parse(req.body);
      const data = await c.get(RequestCourierJobUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/jobs/open', requireAuth(c), requireRole(...COURIER_ROLES), async (req, res, next) => {
    try {
      const data = await c.get(ListOpenCourierJobsUseCase).execute(parseNear(req.query));
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/jobs/open/nearby', requireAuth(c), requireRole(...COURIER_ROLES), async (req, res, next) => {
    try {
      const near = parseNear(req.query);
      if (!near) return res.status(422).json({ error: { code: 'validation', message: 'lng and lat query params are required' } });
      const data = await c.get(ListNearbyCourierJobsUseCase).execute(near);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/jobs/my', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyCourierJobsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/route', requireAuth(c), requireRole(...COURIER_ROLES), async (req, res, next) => {
    try {
      const input = RouteSchema.parse(req.body);
      const data = await c.get(CalculateRouteUseCase).execute(input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  // Public tracking projection — no codes, no personal ids.
  r.get('/jobs/:id/track', async (req, res, next) => {
    try {
      const jobs = c.get<ICourierJobRepository>(TOKENS.CourierJobRepository);
      const job = await jobs.findById(req.params.id as string);
      if (!job) throw new NotFoundError('Courier job');
      const s = job.snapshot;
      ok(res, {
        id: s.id,
        status: s.status,
        pickup: s.pickup.name,
        dropoff: s.dropoff.name,
        updatedAt: s.updatedAt.toISOString(),
      });
    } catch (e) {
      next(e);
    }
  });

  r.get('/jobs/:id', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(GetCourierJobUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/jobs/:id/accept', requireAuth(c), requireRole(...COURIER_ROLES), async (req, res, next) => {
    try {
      const data = await c.get(AcceptCourierJobUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/jobs/:id/transition', requireAuth(c), requireRole(...COURIER_ROLES), async (req, res, next) => {
    try {
      const input = TransitionSchema.parse(req.body);
      const data = await c
        .get(TransitionCourierJobUseCase)
        .execute(req.params.id as string, req.auth!.sub, input.transition, input.code);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
