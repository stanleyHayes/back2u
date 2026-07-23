import type { InstitutionDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { Institution } from '../../../domain/institution/institution.entity.js';
import type { IInstitutionRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

export function toInstitutionDTO(i: Institution): InstitutionDTO {
  const s = i.snapshot;
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    contactEmail: s.contactEmail,
    place: s.place,
    pointsRedeemable: s.pointsRedeemable,
    pointToCurrencyRate: s.pointToCurrencyRate,
    subscriptionTier: s.subscriptionTier,
    subscriptionRenewsAt: s.subscriptionRenewsAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
    rewardsListed: s.rewardsListed,
    logoUrl: s.logoUrl,
    description: s.description,
    website: s.website,
  };
}

@injectable()
export class ListRewardPartnersUseCase {
  constructor(@inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository) {}

  async execute(category?: string): Promise<InstitutionDTO[]> {
    const all = await this.institutions.list(500);
    return all
      .filter((i) => i.snapshot.rewardsListed)
      .filter((i) => !category || category === 'all' || i.snapshot.type === category)
      .map(toInstitutionDTO);
  }
}
