import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { ListAuditLogsUseCase } from '../../../application/use-cases/audit/audit.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const ListQuerySchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const auditRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const { entity, entityId, actorId, limit } = ListQuerySchema.parse(req.query);
      const data = await c.get(ListAuditLogsUseCase).execute({ entity, entityId, actorId, limit });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
