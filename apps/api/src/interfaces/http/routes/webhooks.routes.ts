import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  CreateWebhookUseCase,
  DeleteWebhookUseCase,
  DeliverWebhookUseCase,
  ListWebhooksUseCase,
  UpdateWebhookUseCase,
} from '../../../application/use-cases/webhook/webhook.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
});

const UpdateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string().min(1)).min(1).optional(),
  active: z.boolean().optional(),
});

export const webhooksRouter = (c: Container): Router => {
  const r = Router();
  const partnerAdmin = [requireAuth(c), requireRole('partner_admin', 'admin', 'super_admin')] as const;

  r.post('/', ...partnerAdmin, async (req, res, next) => {
    try {
      const input = CreateWebhookSchema.parse(req.body);
      const data = await c.get(CreateWebhookUseCase).execute(req.auth!.institutionId as string, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/', ...partnerAdmin, async (req, res, next) => {
    try {
      const data = await c.get(ListWebhooksUseCase).execute(req.auth!.institutionId as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id', ...partnerAdmin, async (req, res, next) => {
    try {
      const input = UpdateWebhookSchema.parse(req.body);
      const data = await c
        .get(UpdateWebhookUseCase)
        .execute(req.params.id as string, req.auth!.institutionId as string, input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', ...partnerAdmin, async (req, res, next) => {
    try {
      await c.get(DeleteWebhookUseCase).execute(req.params.id as string, req.auth!.institutionId as string);
      ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/deliver', ...partnerAdmin, async (req, res, next) => {
    try {
      const data = await c
        .get(DeliverWebhookUseCase)
        .execute(req.params.id as string, req.auth!.institutionId as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
