import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { GenerateUploadSignatureUseCase } from '../../../application/use-cases/upload/generate-upload-signature.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const SignatureSchema = z.object({
  folder: z.string().min(1).max(100),
});

export const uploadsRouter = (c: Container): Router => {
  const r = Router();

  r.post('/signature', requireAuth(c), async (req, res, next) => {
    try {
      const { folder } = SignatureSchema.parse(req.body);
      const data = await c.get(GenerateUploadSignatureUseCase).execute(folder);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
