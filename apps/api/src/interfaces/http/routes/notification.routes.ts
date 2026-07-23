import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  CountUnreadNotificationsUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '../../../application/use-cases/notification/notification.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

export const notificationRouter = (c: Container): Router => {
  const r = Router();

  r.use(requireAuth(c));

  r.get('/', async (req, res, next) => {
    try {
      const limit = z.coerce.number().int().min(1).max(100).default(50).parse(req.query.limit);
      const data = await c.get(ListNotificationsUseCase).execute(req.auth!.sub, limit);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/unread-count', async (req, res, next) => {
    try {
      const data = await c.get(CountUnreadNotificationsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/read-all', async (req, res, next) => {
    try {
      await c.get(MarkAllNotificationsReadUseCase).execute(req.auth!.sub);
      ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/read', async (req, res, next) => {
    try {
      await c.get(MarkNotificationReadUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
