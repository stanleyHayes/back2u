import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import { User } from '../domain/user/user.entity.js';
import { Item } from '../domain/item/item.entity.js';
import { Match } from '../domain/match/match.entity.js';
import { MarketplaceListing } from '../domain/marketplace_listing/marketplace-listing.entity.js';
import { QrTag } from '../domain/tag/qr-tag.entity.js';
import { CourierJob } from '../domain/courier/courier-job.entity.js';
import { newId } from '../domain/shared/id.js';
import type {
  IUserRepository,
  IItemRepository,
  IMatchRepository,
  IMarketplaceListingRepository,
  IQrTagRepository,
  ICourierJobRepository,
  IRewardRepository,
} from '../application/ports/repositories.js';

const CATEGORIES = ['Phone', 'Wallet', 'Bag', 'Keys', 'Laptop', 'Jewelry', 'Documents', 'Other'];
const PLACES = [
  { name: 'KNUST', lng: -1.567, lat: 6.673 },
  { name: 'Accra Mall', lng: -0.176, lat: 5.603 },
  { name: 'Labadi Beach', lng: -0.167, lat: 5.592 },
  { name: 'University of Ghana', lng: -0.186, lat: 5.65 },
  { name: 'Osu', lng: -0.181, lat: 5.555 },
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);

  await connectMongo(env.MONGO_URI);

  // Ensure models are registered
  await import('../infrastructure/persistence/mongo/models/item.model.js');
  await import('../infrastructure/persistence/mongo/models/user.model.js');
  await import('../infrastructure/persistence/mongo/models/match.model.js');
  await import('../infrastructure/persistence/mongo/models/marketplace.model.js');
  await import('../infrastructure/persistence/mongo/models/qr-tag.model.js');
  await import('../infrastructure/persistence/mongo/models/courier.model.js');
  await import('../infrastructure/persistence/mongo/models/reward.model.js');

  const usersRepo = c.get<IUserRepository>(TOKENS.UserRepository);
  const itemsRepo = c.get<IItemRepository>(TOKENS.ItemRepository);
  const matchesRepo = c.get<IMatchRepository>(TOKENS.MatchRepository);
  const mpRepo = c.get<IMarketplaceListingRepository>(TOKENS.MarketplaceListingRepository);
  const tagsRepo = c.get<IQrTagRepository>(TOKENS.QrTagRepository);
  const courierRepo = c.get<ICourierJobRepository>(TOKENS.CourierJobRepository);
  const rewardsRepo = c.get<IRewardRepository>(TOKENS.RewardRepository);

  logger.info('Clearing existing data...');
  for (const model of Object.values(mongoose.models)) {
    await model.deleteMany({});
  }

  // Create users
  logger.info('Seeding users...');
  const users: User[] = [];
  for (let i = 0; i < 20; i++) {
    const u = User.create({
      id: newId(),
      email: `user${i}@example.com`,
      name: `User ${i + 1}`,
      passwordHash: 'seed-hash',
      locale: 'en',
    });
    await usersRepo.save(u);
    users.push(u);
  }

  // Create items
  logger.info('Seeding items...');
  const items: Item[] = [];
  for (let i = 0; i < 30; i++) {
    const place = rand(PLACES);
    const item = Item.create({
      id: newId(),
      kind: i % 2 === 0 ? 'lost' : 'found',
      classification: 'lost',
      title: `${rand(CATEGORIES)} ${rand(['black', 'blue', 'red', 'green', 'brown'])} ${rand(['near', 'at', 'around'])} ${place.name}`,
      description: `A ${rand(CATEGORIES).toLowerCase()} was ${i % 2 === 0 ? 'lost' : 'found'} near ${place.name}. Please contact if you have any information.`,
      category: rand(CATEGORIES),
      tags: [rand(CATEGORIES), place.name],
      images: [{ url: `https://picsum.photos/400/300?random=${i}`, publicId: `seed-${i}` }],
      place: { name: place.name, point: { type: 'Point', coordinates: [place.lng, place.lat] } },
      occurredAt: new Date(Date.now() - randInt(1, 30) * 86_400_000),
      postedById: users[i % users.length]!.snapshot.id,
    });
    await itemsRepo.save(item);
    items.push(item);
  }

  // Create matches
  logger.info('Seeding matches...');
  for (let i = 0; i < 5; i++) {
    const lost = items[i * 2]!;
    const found = items[i * 2 + 1]!;
    const match = Match.suggest({
      id: newId(),
      lostItemId: lost.snapshot.id,
      foundItemId: found.snapshot.id,
      imageScore: randInt(40, 100),
      textScore: randInt(60, 100),
      geoScore: randInt(50, 100),
      timeScore: randInt(30, 100),
    });
    await matchesRepo.save(match);
  }

  // Create marketplace listings
  logger.info('Seeding marketplace listings...');
  for (let i = 0; i < 3; i++) {
    const item = items[25 + i]!;
    const listing = MarketplaceListing.list({
      id: newId(),
      itemId: item.snapshot.id,
      startingPrice: randInt(1000, 10000),
      currency: 'GHS',
      closesAt: new Date(Date.now() + randInt(1, 14) * 86_400_000),
    });
    listing.goLive();
    await mpRepo.save(listing);
  }

  // Create QR tags
  logger.info('Seeding QR tags...');
  for (let i = 0; i < 10; i++) {
    const tag = QrTag.mint({ id: newId(), code: `SEED${i.toString().padStart(4, '0')}` });
    if (i < 5) {
      tag.claim(users[i]!.snapshot.id, `My ${rand(CATEGORIES)}`);
    }
    await tagsRepo.save(tag);
  }

  // Create courier jobs
  logger.info('Seeding courier jobs...');
  for (let i = 0; i < 5; i++) {
    const place = rand(PLACES);
    const job = CourierJob.request({
      id: newId(),
      itemId: items[i]!.snapshot.id,
      pickup: { name: place.name, point: { type: 'Point', coordinates: [place.lng, place.lat] } },
      dropoff: { name: rand(PLACES).name, point: { type: 'Point', coordinates: [place.lng + 0.01, place.lat + 0.01] } },
      fee: randInt(2000, 5000),
      currency: 'GHS',
      requesterId: users[i]!.snapshot.id,
      pickupCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      deliveryCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
    await courierRepo.save(job);
  }

  // Create rewards for some lost items
  logger.info('Seeding rewards...');
  const { Reward } = await import('../domain/reward/reward.entity.js');
  for (let i = 0; i < 5; i++) {
    const reward = Reward.create({
      id: newId(),
      itemId: items[i * 2]!.snapshot.id,
      amount: randInt(1000, 5000),
      currency: 'GHS',
    });
    await rewardsRepo.save(reward);
  }

  logger.info('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
