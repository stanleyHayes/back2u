import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import { CourierJob } from '../domain/courier/courier-job.entity.js';
import { newId } from '../domain/shared/id.js';
import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import type { PlaceRef } from '@back2u/shared-types';
import type { IItemRepository, ICourierJobRepository } from '../application/ports/repositories.js';

/**
 * Additive seed: creates a handful of OPEN ("requested") courier jobs so the
 * partner / courier "Open courier jobs" page has content to show. Each job moves
 * a found item from where it was picked up to a campus lost-&-found desk.
 * Idempotent — skips if there are already open jobs.
 */
const code6 = () => Math.floor(100000 + Math.random() * 900000).toString();

// Realistic Accra / Legon drop-off desks (lng, lat).
const DROPOFFS: PlaceRef[] = [
  { name: 'UG Legon — Lost & Found Desk', city: 'Accra', country: 'GH', point: { type: 'Point', coordinates: [-0.1869, 5.6505] } },
  { name: 'Accra Mall — Customer Service', city: 'Accra', country: 'GH', point: { type: 'Point', coordinates: [-0.1714, 5.6212] } },
  { name: 'Kotoka Airport — Help Point', city: 'Accra', country: 'GH', point: { type: 'Point', coordinates: [-0.1718, 5.6052] } },
];
const FEES = [25, 30, 35, 40, 45];

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  await connectMongo(env.MONGO_URI);

  await import('../infrastructure/persistence/mongo/models/courier.model.js');
  await import('../infrastructure/persistence/mongo/models/item.model.js');

  const items = c.get<IItemRepository>(TOKENS.ItemRepository);
  const jobs = c.get<ICourierJobRepository>(TOKENS.CourierJobRepository);

  const open = await jobs.listOpen();
  if (open.length >= 4) {
    logger.info(`${open.length} open courier jobs already exist — skipping.`);
    await mongoose.disconnect();
    return;
  }

  // Prefer found items (they're the ones that get delivered back). Fall back to any.
  let { items: pool } = await items.list({ kind: 'found', status: 'open', page: 1, pageSize: 12 });
  if (pool.length < 4) {
    const any = await items.list({ page: 1, pageSize: 12 });
    pool = any.items;
  }
  if (pool.length === 0) {
    logger.error('No items found to base courier jobs on. Seed items first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const target = Math.min(6, pool.length);
  let created = 0;
  for (let i = 0; i < target; i++) {
    const item = pool[i]!.snapshot;
    const job = CourierJob.request({
      id: newId(),
      itemId: item.id,
      pickup: item.place,
      dropoff: DROPOFFS[i % DROPOFFS.length]!,
      fee: FEES[i % FEES.length]!,
      currency: DEFAULT_CURRENCY,
      requesterId: item.postedById,
      pickupCode: code6(),
      deliveryCode: code6(),
    });
    await jobs.save(job);
    created++;
  }

  logger.info(`Seeded ${created} open courier job(s).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
