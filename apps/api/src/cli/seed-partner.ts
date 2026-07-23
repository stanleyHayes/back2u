import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import { User } from '../domain/user/user.entity.js';
import { newId } from '../domain/shared/id.js';
import type { IUserRepository, IInstitutionRepository } from '../application/ports/repositories.js';
import type { IPasswordHasher } from '../application/ports/services.js';

/**
 * Additive seed: creates a partner_admin login linked to an institution so the
 * partner portal can be used. Idempotent — skips if the account already exists.
 */
const EMAIL = 'partner@back2u.app';
const PASSWORD = 'Password123!';

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  await connectMongo(env.MONGO_URI);

  await import('../infrastructure/persistence/mongo/models/user.model.js');
  await import('../infrastructure/persistence/mongo/models/institution.model.js');

  const users = c.get<IUserRepository>(TOKENS.UserRepository);
  const insts = c.get<IInstitutionRepository>(TOKENS.InstitutionRepository);
  const hasher = c.get<IPasswordHasher>(TOKENS.PasswordHasher);

  const existing = await users.findByEmail(EMAIL);
  if (existing) {
    logger.info(`Partner account ${EMAIL} already exists — skipping.`);
    await mongoose.disconnect();
    return;
  }

  const institutionList = await insts.list();
  const institution = institutionList[0];
  if (!institution) {
    logger.error('No institution found to link the partner account to. Seed an institution first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const passwordHash = await hasher.hash(PASSWORD);
  const user = User.create({
    id: newId(),
    email: EMAIL,
    name: 'Bookshop Partner',
    passwordHash,
    locale: 'en',
    institutionId: institution.snapshot.id,
  });
  // Seed scripts may elevate roles explicitly; User.create always defaults to ['user'].
  user.updateRoles(['partner_admin']);
  // Partner accounts are pre-verified for demo convenience.
  user.verifyEmail();
  await users.save(user);

  logger.info(`Seeded partner account ${EMAIL} linked to "${institution.snapshot.name}".`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
