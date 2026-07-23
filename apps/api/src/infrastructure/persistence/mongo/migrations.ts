import mongoose from 'mongoose';

import type { ILogger } from '../../../application/ports/services.js';

type Db = NonNullable<mongoose.Connection['db']>;

/** Sync declared schema indexes for every registered model. */
export async function ensureIndexes(logger: ILogger): Promise<void> {
  const models = Object.values(mongoose.models);
  for (const model of models) {
    await model.syncIndexes();
  }
  logger.info('mongo indexes synced', { models: models.length });
}

interface Migration {
  id: string;
  up(db: Db): Promise<void>;
}

// Versioned, irreversible data migrations. Index changes belong in schema
// definitions (picked up by ensureIndexes); only destructive / backfilling
// changes go here, appended in order and never edited once released.
const MIGRATIONS: Migration[] = [];

export async function runMigrations(logger: ILogger): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('runMigrations: mongo not connected');

  const ledger = db.collection<{ _id: string; appliedAt: Date }>('_back2u_migrations');
  const applied = new Set(
    (await ledger.find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id),
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    logger.info('applying migration', { id: migration.id });
    await migration.up(db);
    await ledger.insertOne({ _id: migration.id, appliedAt: new Date() });
    logger.info('migration applied', { id: migration.id });
  }
}
