import express, { Router } from 'express';
import type { Container } from 'inversify';

import { TOKENS } from '../../../application/ports/tokens.js';
import { HandleInboundSmsUseCase } from '../../../application/use-cases/sms/sms-inbound.use-case.js';
import type { Env } from '../../../config/env.js';

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const twiml = (message?: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${escapeXml(message)}</Message>` : ''}</Response>`;

export const smsRouter = (c: Container): Router => {
  const r = Router();

  // Twilio posts application/x-www-form-urlencoded payloads.
  r.use(express.urlencoded({ extended: false }));

  r.post('/inbound', async (req, res, next) => {
    try {
      const env = c.get<Env>(TOKENS.Env);
      const url = `${env.API_PUBLIC_URL}${req.originalUrl}`;
      const signature = req.headers['x-twilio-signature'] as string | undefined;
      const payload = (req.body ?? {}) as Record<string, string>;
      // The use-case verifies the Twilio request signature (throws 401 on mismatch).
      const { reply } = await c.get(HandleInboundSmsUseCase).execute(payload, signature, url);
      res.type('text/xml').send(twiml(reply));
    } catch (e) {
      next(e);
    }
  });

  return r;
};
