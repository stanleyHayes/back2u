import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  GetMarketplaceListingUseCase,
  ListLiveMarketplaceUseCase,
  ListMyBidsUseCase,
  ListUnclaimedAsAuctionUseCase,
  PlaceBidUseCase,
  SettleMarketplaceAuctionUseCase,
} from '../../../application/use-cases/marketplace/marketplace.use-cases.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const CreateListingSchema = z.object({
  itemId: z.string().min(1),
  startingPrice: z.number().int().min(0),
  buyNowPrice: z.number().int().min(0).optional(),
  daysOpen: z.number().int().min(1).max(30).optional(),
  charityRecipient: z.string().optional(),
});

const PlaceBidSchema = z.object({
  amount: z.number().int().min(1),
});

export const marketplaceRouter = (c: Container): Router => {
  const r = Router();

  r.get('/', async (_req, res, next) => {
    try {
      const data = await c.get(ListLiveMarketplaceUseCase).execute();
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/bids/my', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListMyBidsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', async (req, res, next) => {
    try {
      const data = await c.get(GetMarketplaceListingUseCase).execute(req.params.id as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireAuth(c), requireRole('admin', 'super_admin'), async (req, res, next) => {
    try {
      const input = CreateListingSchema.parse(req.body);
      const data = await c.get(ListUnclaimedAsAuctionUseCase).execute(input);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/bids', requireAuth(c), async (req, res, next) => {
    try {
      const { amount } = PlaceBidSchema.parse(req.body);
      const data = await c
        .get(PlaceBidUseCase)
        .execute(req.auth!.sub, { listingId: req.params.id as string, amount });
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post(
    '/:id/close',
    requireAuth(c),
    requireRole('admin', 'super_admin'),
    async (req, res, next) => {
      try {
        const data = await c.get(SettleMarketplaceAuctionUseCase).execute(req.params.id as string);
        ok(res, data);
      } catch (e) {
        next(e);
      }
    },
  );

  return r;
};
