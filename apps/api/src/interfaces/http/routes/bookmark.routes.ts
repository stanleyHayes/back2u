import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  BookmarkItemUseCase,
  ListMyBookmarksUseCase,
  UnbookmarkItemUseCase,
} from '../../../application/use-cases/bookmark/bookmark.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const BookmarkSchema = z.object({
  itemId: z.string().min(1),
});

export const bookmarkRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyBookmarksUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), async (req, res, next) => {
    try {
      const { itemId } = BookmarkSchema.parse(req.body);
      const data = await c.get(BookmarkItemUseCase).execute(req.auth!.sub, itemId);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:itemId', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c
        .get(BookmarkItemUseCase)
        .execute(req.auth!.sub, req.params.itemId as string);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:itemId', requireAuth(c), async (req, res, next) => {
    try {
      await c.get(UnbookmarkItemUseCase).execute(req.auth!.sub, req.params.itemId as string);
      ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
};
