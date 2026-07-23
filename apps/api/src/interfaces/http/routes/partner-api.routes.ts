import { createHash } from 'node:crypto';

import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Redis } from 'ioredis';
import type { Container } from 'inversify';
import { z } from 'zod';

import { GetPartnerStatsUseCase } from '../../../application/use-cases/admin/get-partner-stats.js';
import {
  CreatePartnerItemUseCase,
  GetPartnerItemUseCase,
  ListPartnerItemsUseCase,
  UpdatePartnerItemStatusUseCase,
} from '../../../application/use-cases/partner-api/index.js';
import type { IPartnerApiKeyRepository } from '../../../application/ports/repositories.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import { UnauthorizedError } from '../../../domain/shared/errors.js';
import { ok } from './_helpers.js';

const ItemStatusSchema = z.enum([
  'open',
  'matched',
  'claimed',
  'returned',
  'closed',
  'archived',
  'auctioned',
  'donated',
]);

const CreateItemSchema = z.object({
  kind: z.enum(['lost', 'found']),
  classification: z.enum(['lost', 'stolen']),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  images: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  ),
  place: z.object({
    name: z.string().min(1),
    city: z.string().optional(),
    country: z.string().optional(),
    point: z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
  }),
  occurredAt: z.string().min(1),
  rewardAmount: z.number().int().min(0).optional(),
  institutionId: z.string().optional(),
  qrTagCode: z.string().optional(),
  serialNumber: z.string().optional(),
  imei: z.string().optional(),
});

const ListQuerySchema = z.object({
  kind: z.enum(['lost', 'found']).optional(),
  status: ItemStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const StatusSchema = z.object({ status: ItemStatusSchema });

const hashKey = (key: string): string => createHash('sha256').update(key).digest('hex');

/** Authenticate institution partners via the `X-API-Key` header (sha256-hashed at rest). */
const requireApiKey =
  (c: Container, redis: Redis | null) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.header('X-API-Key');
      if (!header) throw new UnauthorizedError('Missing API key');
      const keyHash = hashKey(header);
      const cacheKey = `partner-api-key:${keyHash}`;

      let institutionId = redis ? await redis.get(cacheKey) : null;
      if (!institutionId) {
        const keys = c.get<IPartnerApiKeyRepository>(TOKENS.PartnerApiKeyRepository);
        const apiKey = await keys.findByKeyHash(keyHash);
        if (!apiKey) throw new UnauthorizedError('Invalid API key');
        institutionId = apiKey.snapshot.institutionId;
        apiKey.markUsed();
        await keys.save(apiKey);
        if (redis) await redis.set(cacheKey, institutionId, 'EX', 60);
      }

      res.locals.institutionId = institutionId;
      next();
    } catch (e) {
      next(e);
    }
  };

export const partnerApiRouter = (c: Container, redis: Redis | null): Router => {
  const r = Router();

  r.use(requireApiKey(c, redis));

  const institutionId = (res: Response): string => res.locals.institutionId as string;

  r.get('/items', async (req, res, next) => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const data = await c.get(ListPartnerItemsUseCase).execute(institutionId(res), query);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/items', async (req, res, next) => {
    try {
      const input = CreateItemSchema.parse(req.body);
      const data = await c.get(CreatePartnerItemUseCase).execute(institutionId(res), input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.get('/items/:id', async (req, res, next) => {
    try {
      const data = await c.get(GetPartnerItemUseCase).execute(institutionId(res), req.params.id as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/items/:id/status', async (req, res, next) => {
    try {
      const input = StatusSchema.parse(req.body);
      const data = await c
        .get(UpdatePartnerItemStatusUseCase)
        .execute(institutionId(res), req.params.id as string, input.status);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/stats', async (_req, res, next) => {
    try {
      const data = await c.get(GetPartnerStatsUseCase).execute(institutionId(res));
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
