import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { SettleMarketplaceAuctionUseCase, ListUnclaimedAsAuctionUseCase } from '../../application/use-cases/marketplace/marketplace.use-cases.js';

describe('Marketplace settlement flow (integration)', () => {
  let app: ReturnType<typeof buildApp>;
  let container: ReturnType<typeof buildTestContainer>;

  const place = {
    name: 'KNUST',
    point: { type: 'Point' as const, coordinates: [-1.567, 6.673] as [number, number] },
  };

  beforeAll(async () => {
    await startTestMongo();
    container = buildTestContainer();
    app = buildApp(container);
    await ensureTestIndexes();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  beforeEach(async () => {
    await clearTestMongo();
  });

  it('list unclaimed item → bid → auction close → winner determined', async () => {
    // Seller posts item and closes it
    const sellerReg = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'seller@example.com', password: 'password123', name: 'Seller' });
    expect(sellerReg.status).toBe(201);
    const sellerToken = sellerReg.body.data.tokens.accessToken;

    const itemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Vintage camera',
        description: 'Canon AE-1',
        category: 'Electronics',
        images: [{ url: 'https://example.com/camera.jpg', publicId: 'c1' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(itemRes.status).toBe(201);
    const itemId = itemRes.body.data.id;

    // Close the item so it can be auctioned
    await request(app)
      .patch(`/v1/items/${itemId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'closed' })
      .expect(200);

    // List as auction (direct use-case call to bypass admin role middleware)
    const listing = await container.get(ListUnclaimedAsAuctionUseCase).execute({
      itemId,
      startingPrice: 5000,
      daysOpen: 1,
    });
    const listingId = listing.id;

    // Bidder A places bid
    const bidderA = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'bidder-a@example.com', password: 'password123', name: 'Bidder A' });
    const tokenA = bidderA.body.data.tokens.accessToken;

    const bidA = await request(app)
      .post(`/v1/marketplace/${listingId}/bids`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 6000 });
    expect(bidA.status).toBe(201);

    // Bidder B outbids
    const bidderB = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'bidder-b@example.com', password: 'password123', name: 'Bidder B' });
    const tokenB = bidderB.body.data.tokens.accessToken;
    const userB = bidderB.body.data.user;

    const bidB = await request(app)
      .post(`/v1/marketplace/${listingId}/bids`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 8000 });
    expect(bidB.status).toBe(201);

    // Verify listing shows bids
    const listingGet = await request(app)
      .get(`/v1/marketplace/${listingId}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(listingGet.status).toBe(200);
    expect(listingGet.body.data.bids.length).toBe(2);

    // Settle auction (direct use-case call)
    const settle = await container.get(SettleMarketplaceAuctionUseCase).execute(listingId);
    expect(settle.winnerId).toBe(userB.id);
    expect(settle.winningAmount).toBe(8000);

    // Verify listing is closed
    const listingAfter = await request(app)
      .get(`/v1/marketplace/${listingId}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(listingAfter.body.data.listing.status).toBe('sold');
  });

  it('no bids → auction close → no winner', async () => {
    const sellerReg = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'seller2@example.com', password: 'password123', name: 'Seller2' });
    const sellerToken = sellerReg.body.data.tokens.accessToken;

    const itemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Old book',
        description: 'Rare edition',
        category: 'Books',
        images: [{ url: 'https://example.com/book.jpg', publicId: 'b1' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    const itemId = itemRes.body.data.id;

    await request(app)
      .patch(`/v1/items/${itemId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'closed' })
      .expect(200);

    const listing = await container.get(ListUnclaimedAsAuctionUseCase).execute({
      itemId,
      startingPrice: 1000,
      daysOpen: 1,
    });
    const listingId = listing.id;

    const settle = await container.get(SettleMarketplaceAuctionUseCase).execute(listingId);
    expect(settle.winnerId).toBeUndefined();
    expect(settle.winningAmount).toBe(1000);
  });
});
