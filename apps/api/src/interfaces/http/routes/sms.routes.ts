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
      // Arkesel does not sign requests; the callback carries a shared secret.
      // Prefer the `x-webhook-secret` header (kept out of URLs/access logs); fall
      // back to `?token=` only if the header is absent.
      const secret =
        (req.headers['x-webhook-secret'] as string | undefined) ??
        (req.query.token as string | undefined);
      // Build the payload from Arkesel's message fields ONLY. The shared secret
      // must never be forwarded into application logic or downstream logs.
      const payload = { ...(req.query as Record<string, string>), ...(req.body ?? {}) } as Record<
        string,
        string
      >;
      delete payload.token;
      await c.get(HandleInboundSmsUseCase).execute(payload, secret);
      // Arkesel only needs a 2xx ack; any reply is sent out-of-band via the SMS API.
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
