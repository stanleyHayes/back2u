import 'reflect-metadata';

import mongoose from 'mongoose';

import { TOKENS } from '../application/ports/tokens.js';
import { buildContainer } from '../composition/container.js';
import type { Env } from '../config/env.js';
import { connectMongo } from '../infrastructure/persistence/mongo/connect.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import { Institution } from '../domain/institution/institution.entity.js';
import { newId } from '../domain/shared/id.js';
import type { IInstitutionRepository } from '../application/ports/repositories.js';
import type { InstitutionType } from '@back2u/shared-types';

/**
 * Additive seed: a handful of opted-in reward partners (restaurants, malls, cafés)
 * so the public rewards directory has content. Idempotent — skips if already seeded.
 */
interface Demo {
  name: string;
  type: InstitutionType;
  description: string;
  rate: number; // pesewa per point
  lng: number;
  lat: number;
  city: string;
  logoSeed: string;
  website: string;
}

const DEMOS: Demo[] = [
  { name: 'Marina Mall', type: 'mall', description: 'Spend points on gift cards and food-court treats at Ghana’s favourite mall.', rate: 3, lng: -0.1714, lat: 5.6212, city: 'Accra', logoSeed: 'marinamall', website: 'https://example.com/marina' },
  { name: 'Chez Clara Restaurant', type: 'restaurant', description: 'Redeem points for a discount on Ghanaian & continental dishes in Osu.', rate: 5, lng: -0.182, lat: 5.556, city: 'Accra', logoSeed: 'chezclara', website: 'https://example.com/chezclara' },
  { name: 'Legon Cafe & Roastery', type: 'cafe', description: 'A free pastry with any coffee when you pay with finder points near campus.', rate: 4, lng: -0.187, lat: 5.6515, city: 'Accra', logoSeed: 'legoncafe', website: 'https://example.com/legoncafe' },
  { name: 'HealthPlus Pharmacy', type: 'pharmacy', description: 'Knock points off everyday health and wellness essentials.', rate: 2, lng: -0.2057, lat: 5.6037, city: 'Accra', logoSeed: 'healthplus', website: 'https://example.com/healthplus' },
];

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  await connectMongo(env.MONGO_URI);

  await import('../infrastructure/persistence/mongo/models/institution.model.js');

  const insts = c.get<IInstitutionRepository>(TOKENS.InstitutionRepository);
  const existing = await insts.list(500);

  // 1) Make sure the demo partner's own institution is listed too (so the partner
  //    portal toggle shows something live for the seeded partner login).
  const first = existing[0];
  if (first && !first.snapshot.rewardsListed) {
    first.updateRewardsProfile({
      rewardsListed: true,
      pointsRedeemable: true,
      pointToCurrencyRate: 2,
      description: first.snapshot.description ?? 'Earn and redeem finder points at our front desk.',
    });
    await insts.save(first);
    logger.info(`Listed existing institution "${first.snapshot.name}" in the rewards directory.`);
  }

  // 2) Seed the demo reward partners (skip any that already exist by name).
  const names = new Set(existing.map((i) => i.snapshot.name));
  let created = 0;
  for (const d of DEMOS) {
    if (names.has(d.name)) continue;
    const inst = Institution.onboard({
      id: newId(),
      name: d.name,
      type: d.type,
      contactEmail: `${d.logoSeed}@partners.back2u.app`,
      place: { name: d.name, city: d.city, country: 'Ghana', point: { type: 'Point', coordinates: [d.lng, d.lat] } },
      pointsRedeemable: true,
      pointToCurrencyRate: d.rate,
      rewardsListed: true,
      logoUrl: `https://picsum.photos/seed/${d.logoSeed}/640/360`,
      description: d.description,
      website: d.website,
      subscriptionTier: 'free',
    });
    await insts.save(inst);
    created++;
  }

  logger.info(`Seeded ${created} reward partner(s).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
