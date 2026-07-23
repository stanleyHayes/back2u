import { DEFAULT_CURRENCY, type CreateRedemptionInput, type RedemptionDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { generate6DigitCode } from '../../../domain/auth/otp.entity.js';
import { PointsRedemption } from '../../../domain/redemption/redemption.entity.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IInstitutionRepository, IUserRepository } from '../../ports/repositories.js';
import type { IRedemptionRepository } from '../../ports/redemption-repo.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(r: PointsRedemption, institutionName?: string): RedemptionDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    institutionId: s.institutionId,
    institutionName,
    points: s.points,
    value: s.value,
    currency: s.currency,
    code: s.code,
    status: s.status,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    fulfilledAt: s.fulfilledAt?.toISOString(),
  };
}

@injectable()
export class CreateRedemptionUseCase {
  constructor(
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
  ) {}
  async execute(userId: Id, input: CreateRedemptionInput): Promise<RedemptionDTO> {
    const institution = await this.institutions.findById(input.institutionId);
    if (!institution) throw new NotFoundError('Institution');
    if (!institution.snapshot.pointsRedeemable) {
      throw new ValidationError('Institution does not accept point redemptions');
    }
    if (input.points <= 0) throw new ValidationError('Points must be positive');
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (user.snapshot.pointsBalance < input.points) throw new ValidationError('Insufficient points');
    user.spendPoints(input.points);
    const rate = institution.snapshot.pointToCurrencyRate ?? 1;
    const redemption = PointsRedemption.create({
      id: newId(),
      userId,
      institutionId: input.institutionId,
      points: input.points,
      value: input.points * rate,
      currency: DEFAULT_CURRENCY,
      code: generate6DigitCode(),
    });
    await this.users.save(user);
    await this.redemptions.save(redemption);
    return toDTO(redemption, institution.snapshot.name);
  }
}

@injectable()
export class ListMyRedemptionsUseCase {
  constructor(
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
  ) {}
  async execute(userId: Id, limit = 50): Promise<RedemptionDTO[]> {
    const list = await this.redemptions.listForUser(userId, limit);
    const names = new Map<Id, string>();
    for (const r of list) {
      const institutionId = r.snapshot.institutionId;
      if (!names.has(institutionId)) {
        const institution = await this.institutions.findById(institutionId);
        if (institution) names.set(institutionId, institution.snapshot.name);
      }
    }
    return list.map((r) => toDTO(r, names.get(r.snapshot.institutionId)));
  }
}

@injectable()
export class ListInstitutionRedemptionsUseCase {
  constructor(
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
  ) {}
  async execute(institutionId: Id, limit = 100): Promise<RedemptionDTO[]> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');
    const list = await this.redemptions.listForInstitution(institutionId, limit);
    return list.map((r) => toDTO(r, institution.snapshot.name));
  }
}

@injectable()
export class ConfirmRedemptionUseCase {
  constructor(
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
  ) {}
  async execute(input: { code: string; institutionId?: Id }): Promise<RedemptionDTO> {
    const redemption = await this.redemptions.findByCode(input.code);
    if (!redemption) throw new NotFoundError('Redemption');
    if (input.institutionId && redemption.snapshot.institutionId !== input.institutionId) {
      throw new ForbiddenError('Redemption belongs to another institution');
    }
    if (redemption.snapshot.status !== 'pending') throw new ConflictError('Redemption is not pending');
    redemption.fulfil();
    await this.redemptions.save(redemption);
    const institution = await this.institutions.findById(redemption.snapshot.institutionId);
    return toDTO(redemption, institution?.snapshot.name);
  }
}
