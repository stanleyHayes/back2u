import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import type { IWebPushService } from '../../../application/ports/extra-services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import { newId } from '../../../domain/shared/id.js';
import { WebPushSubscription } from '../../../domain/web_push/subscription.entity.js';
import type { IWebPushSubscriptionRepository } from '../../../infrastructure/persistence/mongo/repositories/web-push.repo.mongo.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const webPushRouter = (c: Container): Router => {
  const r = Router();

  r.get('/key', (req, res) => {
    const push = c.get<IWebPushService>(TOKENS.WebPushService);
    ok(res, { vapidPublicKey: push.vapidPublicKey() });
  });

  r.post('/subscribe', requireAuth(c), async (req, res, next) => {
    try {
      const input = SubscribeSchema.parse(req.body);
      const repo = c.get<IWebPushSubscriptionRepository>(TOKENS.WebPushSubscriptionRepository);
      const sub = WebPushSubscription.register({
        id: newId(),
        userId: req.auth!.sub,
        endpoint: input.endpoint,
        keys: input.keys,
        userAgent: req.headers['user-agent'],
      });
      await repo.save(sub);
      ok(res, { ok: true }, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/unsubscribe', requireAuth(c), async (req, res, next) => {
    try {
      const input = UnsubscribeSchema.parse(req.body);
      const repo = c.get<IWebPushSubscriptionRepository>(TOKENS.WebPushSubscriptionRepository);
      await repo.deleteByEndpoint(input.endpoint);
      ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
