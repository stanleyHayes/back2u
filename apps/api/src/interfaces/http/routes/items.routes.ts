import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import type { ItemListQuery } from '@back2u/shared-types';

import { AutocompleteSearchUseCase } from '../../../application/use-cases/item/autocomplete-search.js';
import { BumpItemUseCase } from '../../../application/use-cases/item/bump-item.js';
import { ClearItemReviewFlagUseCase } from '../../../application/use-cases/item/clear-review-flag.js';
import { CreateItemUseCase } from '../../../application/use-cases/item/create-item.js';
import { GetItemUseCase } from '../../../application/use-cases/item/get-item.js';
import { ListFlaggedItemsUseCase } from '../../../application/use-cases/item/list-flagged-items.js';
import { ListItemsUseCase } from '../../../application/use-cases/item/list-items.js';
import { UpdateItemUseCase } from '../../../application/use-cases/item/update-item.js';
import { ListMatchesForItemUseCase } from '../../../application/use-cases/match/list-matches-for-item.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const ItemImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

const PlaceRefSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  point: GeoPointSchema,
});

const CreateItemSchema = z.object({
  kind: z.enum(['lost', 'found']),
  classification: z.enum(['lost', 'stolen']).default('lost'),
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(2000),
  category: z.string().min(2).max(60),
  tags: z.array(z.string()).max(20).optional(),
  images: z.array(ItemImageSchema).min(1).max(8),
  place: PlaceRefSchema,
  occurredAt: z.string().datetime(),
  rewardAmount: z.number().int().min(0).optional(),
  institutionId: z.string().optional(),
  qrTagCode: z.string().optional(),
  serialNumber: z.string().optional(),
  imei: z.string().optional(),
});

const UpdateItemSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().min(2).max(2000).optional(),
  category: z.string().min(2).max(60).optional(),
  tags: z.array(z.string()).max(20).optional(),
  classification: z.enum(['lost', 'stolen']).optional(),
  status: z.enum(['open', 'matched', 'claimed', 'returned', 'closed', 'archived']).optional(),
});

const ListQuerySchema = z.object({
  kind: z.enum(['lost', 'found']).optional(),
  status: z
    .enum(['open', 'matched', 'claimed', 'returned', 'closed', 'archived', 'auctioned', 'donated'])
    .optional(),
  category: z.string().optional(),
  text: z.string().optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  postedById: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  lng: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  radius: z.coerce.number().positive().optional(),
});

export const itemsRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', async (req, res, next) => {
    try {
      const q = ListQuerySchema.parse(req.query);
      const query: ItemListQuery = {
        kind: q.kind,
        status: q.status,
        category: q.category,
        text: q.text,
        search: q.search,
        city: q.city,
        dateFrom: q.dateFrom,
        dateTo: q.dateTo,
        postedById: q.postedById,
        page: q.page,
        pageSize: q.pageSize,
        near:
          q.lng !== undefined && q.lat !== undefined
            ? { lng: q.lng, lat: q.lat, radiusMeters: q.radius ?? 5000 }
            : undefined,
      };
      const data = await c.get(ListItemsUseCase).execute(query);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/autocomplete', async (req, res, next) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const data = await c.get(AutocompleteSearchUseCase).execute(q);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/flagged', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const limit = z.coerce.number().int().min(1).max(200).default(50).parse(req.query.limit);
      const data = await c.get(ListFlaggedItemsUseCase).execute(limit);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', async (req, res, next) => {
    try {
      const data = await c.get(GetItemUseCase).execute(req.params.id as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const input = CreateItemSchema.parse(req.body);
      const data = await c.get(CreateItemUseCase).execute({ ...input, postedById: req.auth!.sub });
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id', requireAuth(c), async (req, res, next) => {
    try {
      const input = UpdateItemSchema.parse(req.body);
      const data = await c
        .get(UpdateItemUseCase)
        .execute(req.params.id as string, input, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/bump', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(BumpItemUseCase).execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id/matches', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c
        .get(ListMatchesForItemUseCase)
        .execute(req.params.id as string, req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post(
    '/:id/clear-review-flag',
    requireAuth(c),
    requireRole('admin', 'super_admin'),
    async (req, res, next) => {
      try {
        const data = await c.get(ClearItemReviewFlagUseCase).execute(req.params.id as string);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  return r;
};
