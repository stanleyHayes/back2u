import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  CreateVaultEntryUseCase,
  DeleteVaultEntryUseCase,
  ListVaultEntriesUseCase,
} from '../../../application/use-cases/vault/vault.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const CreateVaultEntrySchema = z.object({
  label: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  serialNumber: z.string().max(120).optional(),
  imei: z.string().max(60).optional(),
  receiptImageUrl: z.string().url().optional(),
  photoUrls: z.array(z.string().url()).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export const vaultRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListVaultEntriesUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateVaultEntrySchema.parse(req.body);
      const data = await c.get(CreateVaultEntryUseCase).execute(req.auth!.sub, input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', requireAuth(c), async (req, res, next) => {
    try {
      await c.get(DeleteVaultEntryUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
