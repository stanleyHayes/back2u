import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  ListUsersUseCase,
  UpdateUserRolesUseCase,
  UpdateUserStatusUseCase,
} from '../../../application/use-cases/user/user.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'banned', 'suspended']),
  reason: z.string().optional(),
});

const UpdateRolesSchema = z.object({
  roles: z
    .array(z.enum(['user', 'finder', 'trusted_finder', 'courier', 'partner_admin', 'admin', 'super_admin']))
    .min(1),
});

export const usersRouter = (c: Container): Router => {
  const r = Router();

  r.use(requireAuth(c), requireRole('admin', 'super_admin'));

  r.get('/', async (req, res, next) => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const data = await c.get(ListUsersUseCase).execute(query);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id/status', async (req, res, next) => {
    try {
      const { status } = UpdateStatusSchema.parse(req.body);
      const data = await c.get(UpdateUserStatusUseCase).execute(req.params.id as string, status);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id/roles', async (req, res, next) => {
    try {
      const { roles } = UpdateRolesSchema.parse(req.body);
      const data = await c.get(UpdateUserRolesUseCase).execute(req.params.id as string, roles);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
