import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  CreateZoneSubscriptionUseCase,
  DeleteZoneSubscriptionUseCase,
  ListMyZoneSubscriptionsUseCase,
} from '../../../application/use-cases/subscription/zone.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const GeoPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()).length(2))).min(1),
});

const CreateZoneSchema = z.object({
  name: z.string().min(1).max(120),
  polygon: GeoPolygonSchema,
  channels: z.array(z.enum(['push', 'email', 'sms'])).min(1).optional(),
});

export const zonesRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyZoneSubscriptionsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateZoneSchema.parse(req.body);
      const data = await c.get(CreateZoneSubscriptionUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', requireAuth(c), async (req, res, next) => {
    try {
      await c.get(DeleteZoneSubscriptionUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
