import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  GetPointsSummaryUseCase,
  ListMyPointLedgerUseCase,
} from '../../../application/use-cases/points/points.use-cases.js';
import {
  GetMyTrustScoreUseCase,
  GetPublicTrustUseCase,
} from '../../../application/use-cases/trust/trust-score.use-cases.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, param, parsePagination } from './_helpers.js';

const StatusQuerySchema = z.enum(['pending', 'cleared', 'reversed', 'cancelled']).optional();

/**
 * A user's own BakPoints. Deliberately excludes anything from the risk engine:
 * spec §6 requires the scoring to stay private, so a held reward reads as
 * "still pending" here rather than explaining which rule fired.
 */
export const pointsRouter = (c: Container): Router => {
  const r = Router();

  r.get('/summary', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(GetPointsSummaryUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/ledger', requireAuth(c), async (req, res, next) => {
    try {
      const status = StatusQuerySchema.parse(req.query.status);
      const { pageSize, skip } = parsePagination(req, 20, 100);
      const data = await c
        .get(ListMyPointLedgerUseCase)
        .execute(req.auth!.sub, { status, limit: pageSize, skip });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  /**
   * The owner's own Trust Score with the full breakdown, so they can see what
   * would actually raise it. Recomputed on read — it is derived, never stored
   * as a running total.
   */
  r.get('/trust', requireAuth(c), async (req, res, next) => {
    try {
      ok(res, await c.get(GetMyTrustScoreUseCase).execute(req.auth!.sub));
    } catch (e) {
      next(e);
    }
  });

  /**
   * Anyone else sees the level and headline score only. The component
   * breakdown names the signals behind the number, and publishing those would
   * tell a bad actor which lever to pull.
   */
  r.get('/trust/:userId', requireAuth(c), async (req, res, next) => {
    try {
      ok(res, await c.get(GetPublicTrustUseCase).execute(param(req, 'userId')));
    } catch (e) {
      next(e);
    }
  });

  return r;
};
