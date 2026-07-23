import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  FilePoliceCaseUseCase,
  GenerateStolenItemReportUseCase,
} from '../../../application/use-cases/announcement/police-case.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const FileCaseSchema = z.object({
  caseNumber: z.string().min(1),
  station: z.string().min(1),
});

export const policeRouter = (c: Container): Router => {
  const r = Router();

  r.post('/items/:id/report', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c
        .get(GenerateStolenItemReportUseCase)
        .execute(req.auth!.sub, req.params.id as string);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/cases/:id/file', requireAuth(c), async (req, res, next) => {
    try {
      const input = FileCaseSchema.parse(req.body);
      const data = await c.get(FilePoliceCaseUseCase).execute(req.auth!.sub, req.params.id as string, input);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
