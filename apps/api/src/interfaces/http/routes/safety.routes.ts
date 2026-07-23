import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  BlockUserUseCase,
  DecideReportUseCase,
  FileReportUseCase,
  ListBlocksUseCase,
  ListOpenReportsUseCase,
  UnblockUserUseCase,
} from '../../../application/use-cases/safety/safety.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const BlockSchema = z.object({
  blockedId: z.string().min(1),
});

const FileReportSchema = z.object({
  target: z.enum(['user', 'item', 'message', 'listing']),
  targetId: z.string().min(1),
  reason: z.enum(['scam', 'harassment', 'spam', 'inappropriate', 'other']),
  note: z.string().max(2000).optional(),
});

const DecideReportSchema = z.object({
  decision: z.enum(['action', 'dismiss', 'resolved']),
  note: z.string().max(2000).optional(),
});

export const safetyRouter = (c: Container): Router => {
  const r = Router();

  r.get('/blocks', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListBlocksUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/blocks', requireAuth(c), async (req, res, next) => {
    try {
      const input = BlockSchema.parse(req.body);
      await c.get(BlockUserUseCase).execute(req.auth!.sub, input.blockedId);
      ok(res, { ok: true }, 201);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/blocks/:blockedId', requireAuth(c), async (req, res, next) => {
    try {
      await c.get(UnblockUserUseCase).execute(req.auth!.sub, req.params.blockedId as string);
      ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/reports', requireAuth(c), async (req, res, next) => {
    try {
      const input = FileReportSchema.parse(req.body);
      const data = await c.get(FileReportUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/reports', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const data = await c.get(ListOpenReportsUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post(
    '/reports/:id/decide',
    requireAuth(c),
    requireRole('admin', 'super_admin'),
    async (req, res, next) => {
      try {
        const input = DecideReportSchema.parse(req.body);
        const data = await c
          .get(DecideReportUseCase)
          .execute(req.auth!.sub, req.params.id as string, input.decision, input.note);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  return r;
};
