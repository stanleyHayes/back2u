import type { InstitutionDTO, UpdateRewardsProfileInput } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IInstitutionRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { toInstitutionDTO } from './list-reward-partners.use-case.js';

@injectable()
export class UpdateRewardsProfileUseCase {
  constructor(@inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository) {}

  async execute(institutionId: Id, input: UpdateRewardsProfileInput): Promise<InstitutionDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');

    institution.updateRewardsProfile(input);
    await this.institutions.save(institution);
    return toInstitutionDTO(institution);
  }
}
