import type { CreateZoneSubscriptionInput, ZoneSubscriptionDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { ZoneSubscription } from '../../../domain/subscription/zone-subscription.entity.js';
import type { IZoneSubscriptionRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(z: ZoneSubscription): ZoneSubscriptionDTO {
  const s = z.snapshot;
  return {
    id: s.id,
    ownerId: s.ownerId,
    name: s.name,
    polygon: s.polygon,
    channels: s.channels,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class CreateZoneSubscriptionUseCase {
  constructor(@inject(TOKENS.ZoneSubscriptionRepository) private readonly repo: IZoneSubscriptionRepository) {}

  async execute(ownerId: Id, input: CreateZoneSubscriptionInput): Promise<ZoneSubscriptionDTO> {
    const ring = input.polygon?.coordinates?.[0];
    if (input.polygon?.type !== 'Polygon' || !ring || ring.length < 4) {
      throw new ValidationError('polygon must be a GeoJSON Polygon ring with at least 4 positions');
    }
    const zone = ZoneSubscription.create({
      id: newId(),
      ownerId,
      name: input.name,
      polygon: input.polygon,
      channels: input.channels?.length ? input.channels : ['push'],
    });
    await this.repo.save(zone);
    return toDTO(zone);
  }
}

@injectable()
export class DeleteZoneSubscriptionUseCase {
  constructor(@inject(TOKENS.ZoneSubscriptionRepository) private readonly repo: IZoneSubscriptionRepository) {}

  async execute(id: Id, ownerId: Id): Promise<void> {
    await this.repo.delete(id, ownerId);
  }
}

@injectable()
export class ListMyZoneSubscriptionsUseCase {
  constructor(@inject(TOKENS.ZoneSubscriptionRepository) private readonly repo: IZoneSubscriptionRepository) {}

  async execute(ownerId: Id): Promise<ZoneSubscriptionDTO[]> {
    const list = await this.repo.listForOwner(ownerId);
    return list.map(toDTO);
  }
}
