import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import { Item } from '../domain/item/item.entity.js';
import { MarketplaceListing } from '../domain/marketplace_listing/marketplace-listing.entity.js';
import { newId } from '../domain/shared/id.js';
import type { IItemRepository, IMarketplaceListingRepository } from '../application/ports/repositories.js';

/**
 * Additive seed: creates a handful of "unclaimed" found items + live marketplace
 * listings. Does NOT clear any collections (unlike seed.ts), so it is safe to run
 * against the demo database. Idempotent: skips if live listings already exist.
 */

const PLACE = {
  name: 'Accra Mall',
  city: 'Accra',
  country: 'Ghana',
  point: { type: 'Point' as const, coordinates: [-0.176, 5.603] as [number, number] },
};

const STOCK = [
  { title: 'Unclaimed iPhone 13 (space grey)', category: 'Phone', price: 8000, buyNow: 14000, days: 5, img: 1011,
    desc: 'Found at the Accra Mall food court and never claimed past the holding window. Factory reset, screen intact. Proceeds top up the finder rewards pool.' },
  { title: 'Black leather laptop bag', category: 'Bag', price: 3000, buyNow: 6000, days: 7, img: 1027,
    desc: 'Handed in at Kotoka Airport lost & found and unclaimed. Good condition, contents removed.' },
  { title: 'Casio wristwatch (silver)', category: 'Jewelry', price: 1500, days: 3, img: 1062, charity: 'UG Welfare Fund',
    desc: 'Recovered at the University of Ghana. Working order. Listed for charity — proceeds to the campus welfare fund.' },
  { title: 'Set of car & house keys', category: 'Keys', price: 500, days: 9, img: 1080,
    desc: 'Found near Osu on a branded fob. Listed so the value can be recycled into the rewards pool.' },
  { title: 'Wireless over-ear headphones', category: 'Other', price: 2500, buyNow: 5000, days: 6, img: 1084,
    desc: 'Unclaimed found item from Labadi. Tested — charges and pairs cleanly. Light wear.' },
];

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  await connectMongo(env.MONGO_URI);

  await import('../infrastructure/persistence/mongo/models/item.model.js');
  await import('../infrastructure/persistence/mongo/models/user.model.js');
  await import('../infrastructure/persistence/mongo/models/marketplace.model.js');

  const itemsRepo = c.get<IItemRepository>(TOKENS.ItemRepository);
  const mpRepo = c.get<IMarketplaceListingRepository>(TOKENS.MarketplaceListingRepository);

  const existing = await mpRepo.listLive(50);
  if (existing.length > 0) {
    logger.info(`Marketplace already has ${existing.length} live listing(s) — skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const UserModel = mongoose.model('User');
  const admin = await UserModel.findOne({ email: 'admin@back2u.app' }).lean();
  const anyUser = admin ?? (await UserModel.findOne().lean());
  const postedById = ((anyUser as { _id?: string } | null)?._id as string) ?? newId();

  let count = 0;
  for (const s of STOCK) {
    const item = Item.create({
      id: newId(),
      kind: 'found',
      classification: 'lost',
      title: s.title,
      description: s.desc,
      category: s.category,
      tags: [s.category, 'unclaimed'],
      images: [{ url: `https://picsum.photos/seed/b2u-mp-${s.img}/640/480`, publicId: `mp-${s.img}` }],
      place: PLACE,
      occurredAt: new Date(Date.now() - 90 * 86_400_000),
      postedById,
    });
    item.markAuctioned();
    await itemsRepo.save(item);

    const listing = MarketplaceListing.list({
      id: newId(),
      itemId: item.snapshot.id,
      startingPrice: s.price,
      currency: 'GHS',
      buyNowPrice: s.buyNow,
      closesAt: new Date(Date.now() + s.days * 86_400_000),
      charityRecipient: s.charity,
    });
    listing.goLive();
    await mpRepo.save(listing);
    count++;
  }

  logger.info(`Seeded ${count} live marketplace listings.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
