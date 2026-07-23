import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { AutocompleteSearchUseCase } from '../../../application/use-cases/item/autocomplete-search.js';
import { SuggestPlacesUseCase } from '../../../application/use-cases/geo/suggest-places.js';
import { ok } from './_helpers.js';

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  lng: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
});

export const geoRouter = (c: Container): Router => {
  const r = Router();

  r.get('/search', async (req, res, next) => {
    try {
      const q = SearchQuerySchema.parse(req.query);
      const data = await c
        .get(SuggestPlacesUseCase)
        .execute({ q: q.q, limit: q.limit, lng: q.lng, lat: q.lat });
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

  return r;
};
