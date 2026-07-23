import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { GetLeaderboardUseCase } from '../../../application/use-cases/leaderboard/leaderboard.use-cases.js';
import { ok } from './_helpers.js';

export const leaderboardRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', async (req, res, next) => {
    try {
      const limit = z.coerce.number().int().min(1).max(100).default(50).parse(req.query.limit);
      const data = await c.get(GetLeaderboardUseCase).execute(limit);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
