import express, { Router } from 'express';
import type { Container } from 'inversify';

import { HandleInboundSmsUseCase } from '../../../application/use-cases/sms/sms-inbound.use-case.js';

export const smsRouter = (c: Container): Router => {
  const r = Router();

  // Arkesel posts inbound SMS / delivery callbacks as JSON or urlencoded form data.
  r.use(express.urlencoded({ extended: false }));
  r.use(express.json());

  r.post('/inbound', async (req, res, next) => {
    try {
      // Arkesel does not sign requests; the callback URL carries a shared secret
      // as `?token=` (or an `x-webhook-secret` header) which the use-case verifies.
      const secret =
        (req.query.token as string | undefined) ??
        (req.headers['x-webhook-secret'] as string | undefined);
      const payload = { ...(req.query as Record<string, string>), ...(req.body ?? {}) } as Record<
        string,
        string
      >;
      const { reply } = await c.get(HandleInboundSmsUseCase).execute(payload, secret);
      // Arkesel only needs a 2xx ack; the reply (if any) is sent via the SMS API.
      res.json({ ok: true, reply });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
