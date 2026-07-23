import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import type { UserRole } from '@back2u/shared-types';

import { User } from '../domain/user/user.entity.js';
import { newId } from '../domain/shared/id.js';
import type { IUserRepository } from '../application/ports/repositories.js';
import type { IPasswordHasher } from '../application/ports/services.js';

/**
 * Additive seed: demo logins matching credentials.txt. Idempotent — existing
 * accounts get their password reset to PASSWORD so the file always tells the truth.
 */
const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'Back2u-Demo-2026!';

const ACCOUNTS: { email: string; name: string; roles?: UserRole[]; points?: number }[] = [
  { email: 'ama@back2u.app', name: 'Ama Mensah', points: 330 },
  { email: 'kofi@back2u.app', name: 'Kofi Boateng', points: 1240 },
  { email: 'akosua@back2u.app', name: 'Akosua Owusu', points: 760 },
  { email: 'admin@back2u.app', name: 'Back2u Admin', roles: ['admin', 'super_admin'] },
  { email: 'partner@back2u.app', name: 'Bookshop Partner', roles: ['partner_admin'] },
];

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  await connectMongo(env.MONGO_URI);

  await import('../infrastructure/persistence/mongo/models/user.model.js');

  const users = c.get<IUserRepository>(TOKENS.UserRepository);
  const hasher = c.get<IPasswordHasher>(TOKENS.PasswordHasher);
  const passwordHash = await hasher.hash(PASSWORD);

  for (const account of ACCOUNTS) {
    const existing = await users.findByEmail(account.email);
    if (existing) {
      existing.changePasswordHash(passwordHash);
      if (account.roles) existing.updateRoles(account.roles);
      existing.verifyEmail();
      await users.save(existing);
      logger.info(`Updated ${account.email} (password reset)`);
      continue;
    }
    const user = User.create({
      id: newId(),
      email: account.email,
      name: account.name,
      passwordHash,
      locale: 'en',
    });
    if (account.roles) user.updateRoles(account.roles);
    if (account.points) user.awardPoints(account.points);
    user.verifyEmail();
    await users.save(user);
    logger.info(`Created ${account.email}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
