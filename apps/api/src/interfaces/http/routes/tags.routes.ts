import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ClaimQrTagUseCase,
  CreateQrTagOrderUseCase,
  GetTagByCodeUseCase,
  HandlePaystackWebhookUseCase,
  ListMyQrTagOrdersUseCase,
  ListMyTagsUseCase,
  ListQrTagProductsUseCase,
  MarkTagLostUseCase,
  MintQrTagsUseCase,
  PayForQrTagOrderUseCase,
  RecordTagHeartbeatUseCase,
  ScanQrTagUseCase,
} from '../../../application/use-cases/tag/qr-tag.use-cases.js';
import { CrowdsourcedHeartbeatUseCase } from '../../../application/use-cases/ble/heartbeat.use-case.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ClaimTagSchema, CreateQrTagOrderSchema, HeartbeatSchema, ScanTagSchema } from '../validators/extra-schemas.js';
import { ok } from './_helpers.js';

export const tagsRouter = (c: Container): Router => {
  const r = Router();

  r.get('/products', async (_req, res, next) => {
    try {
      const data = await c.get(ListQrTagProductsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/orders/my', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyQrTagOrdersUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/orders', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateQrTagOrderSchema.parse(req.body);
      const data = await c.get(CreateQrTagOrderUseCase).execute({
        userId: req.auth!.sub,
        items: input.items,
      });
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  // Paystack initialize → { authorizationUrl, reference }; simulated fulfil → { order, tags }.
  r.post('/orders/:id/pay', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c
        .get(PayForQrTagOrderUseCase)
        .execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  // The use-case verifies the x-paystack-signature HMAC against the raw body.
  r.post('/payments/paystack/webhook', async (req, res, next) => {
    try {
      const data = await c
        .get(HandlePaystackWebhookUseCase)
        .execute(JSON.stringify(req.body), req.header('x-paystack-signature'));
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/mine', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyTagsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/mint', requireAuth(c), requireRole('admin', 'super_admin', 'partner_admin'), async (req, res, next) => {
    try {
      const count = z.coerce.number().int().min(1).parse(req.body.count ?? 10);
      const data = await c.get(MintQrTagsUseCase).execute(count, req.auth!.roles);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/claim', requireAuth(c), async (req, res, next) => {
    try {
      const input = ClaimTagSchema.parse(req.body);
      const data = await c.get(ClaimQrTagUseCase).execute({ ...input, ownerId: req.auth!.sub });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:code', async (req, res, next) => {
    try {
      const data = await c.get(GetTagByCodeUseCase).execute(req.params.code as string);
      if (!data) return res.status(404).json({ error: 'Tag not found' });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:code/scan', async (req, res, next) => {
    try {
      const input = ScanTagSchema.parse(req.body);
      const data = await c.get(ScanQrTagUseCase).execute({ code: req.params.code as string, ...input });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/heartbeat', async (req, res, next) => {
    try {
      const input = HeartbeatSchema.parse(req.body);
      await c.get(RecordTagHeartbeatUseCase).execute({
        code: input.tagCode,
        lng: input.point.lng,
        lat: input.point.lat,
      });
      await c.get(CrowdsourcedHeartbeatUseCase).execute(input);
      ok(res, { received: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/:code/lost', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(MarkTagLostUseCase).execute(req.params.code as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
