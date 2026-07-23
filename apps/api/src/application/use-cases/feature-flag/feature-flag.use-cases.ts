import type { FeatureFlagDTO, FeatureFlagWithStatusDTO, UpdateRolloutInput } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { FeatureFlag } from '../../../domain/feature-flag/feature-flag.entity.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId } from '../../../domain/shared/id.js';
import type { IFeatureFlagRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(flag: FeatureFlag): FeatureFlagDTO {
  const s = flag.snapshot;
  return {
    id: s.id,
    key: s.key,
    name: s.name,
    description: s.description,
    enabled: s.enabled,
    rolloutPercentage: s.rolloutPercentage,
    allowedUserIds: s.allowedUserIds,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export interface SeedFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  allowedUserIds?: string[];
}

@injectable()
export class GetFeatureFlagsUseCase {
  constructor(@inject(TOKENS.FeatureFlagRepository) private readonly flags: IFeatureFlagRepository) {}
  async execute(userId?: string): Promise<FeatureFlagWithStatusDTO[]> {
    const list = await this.flags.listAll();
    return list.map((f) => ({ ...toDTO(f), isEnabledForUser: f.isEnabledForUser(userId) }));
  }
}

@injectable()
export class IsFeatureEnabledUseCase {
  constructor(@inject(TOKENS.FeatureFlagRepository) private readonly flags: IFeatureFlagRepository) {}
  async execute(key: string, userId?: string): Promise<boolean> {
    const flag = await this.flags.findByKey(key);
    if (!flag) return false;
    return flag.isEnabledForUser(userId);
  }
}

@injectable()
export class ToggleFeatureFlagUseCase {
  constructor(@inject(TOKENS.FeatureFlagRepository) private readonly flags: IFeatureFlagRepository) {}
  async execute(key: string): Promise<FeatureFlagDTO> {
    const flag = await this.flags.findByKey(key);
    if (!flag) throw new NotFoundError('Feature flag');
    flag.toggle();
    await this.flags.save(flag);
    return toDTO(flag);
  }
}

@injectable()
export class UpdateRolloutUseCase {
  constructor(@inject(TOKENS.FeatureFlagRepository) private readonly flags: IFeatureFlagRepository) {}
  async execute(key: string, input: UpdateRolloutInput): Promise<FeatureFlagDTO> {
    const flag = await this.flags.findByKey(key);
    if (!flag) throw new NotFoundError('Feature flag');
    flag.setRollout(input.rolloutPercentage, input.allowedUserIds);
    await this.flags.save(flag);
    return toDTO(flag);
  }
}

@injectable()
export class SeedFeatureFlagsUseCase {
  constructor(@inject(TOKENS.FeatureFlagRepository) private readonly flags: IFeatureFlagRepository) {}
  async execute(seeds: SeedFeatureFlagInput[]): Promise<FeatureFlagDTO[]> {
    for (const seed of seeds) {
      const existing = await this.flags.findByKey(seed.key);
      if (existing) continue;
      await this.flags.save(FeatureFlag.create({ id: newId(), ...seed }));
    }
    const all = await this.flags.listAll();
    return all.map(toDTO);
  }
}
