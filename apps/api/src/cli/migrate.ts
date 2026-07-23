import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { ensureIndexes, runMigrations } from '../infrastructure/persistence/mongo/migrations.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  await connectMongo(env.MONGO_URI);
  // Touch every Mongoose model so they register before we sync.
  await import('../infrastructure/persistence/mongo/models/item.model.js');
  await import('../infrastructure/persistence/mongo/models/user.model.js');
  await import('../infrastructure/persistence/mongo/models/match.model.js');
  await import('../infrastructure/persistence/mongo/models/chat.model.js');
  await import('../infrastructure/persistence/mongo/models/reward.model.js');
  await import('../infrastructure/persistence/mongo/models/qr-tag.model.js');
  await import('../infrastructure/persistence/mongo/models/verification.model.js');
  await import('../infrastructure/persistence/mongo/models/courier.model.js');
  await import('../infrastructure/persistence/mongo/models/vault.model.js');
  await import('../infrastructure/persistence/mongo/models/audit.model.js');
  await import('../infrastructure/persistence/mongo/models/zone.model.js');
  await import('../infrastructure/persistence/mongo/models/marketplace.model.js');
  await import('../infrastructure/persistence/mongo/models/police-case.model.js');
  await import('../infrastructure/persistence/mongo/models/institution.model.js');
  await import('../infrastructure/persistence/mongo/models/auth.model.js');
  await import('../infrastructure/persistence/mongo/models/safety.model.js');
  await import('../infrastructure/persistence/mongo/models/web-push.model.js');

  await ensureIndexes(logger);
  await runMigrations(logger);
  await mongoose.connection.close();
  logger.info('migrate done');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('migrate failed', err);
  process.exit(1);
});
