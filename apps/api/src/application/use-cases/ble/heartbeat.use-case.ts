import type { BleHeartbeatInput } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { geoPoint } from '../../../domain/shared/value-objects.js';
import type { IQrTagRepository } from '../../ports/repositories.js';
import type { IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class CrowdsourcedHeartbeatUseCase {
  constructor(
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}
  async execute(input: BleHeartbeatInput): Promise<void> {
    const tag = await this.tags.findByCode(input.tagCode);
    if (!tag) return;
    const point = geoPoint(input.point.lng, input.point.lat);
    tag.recordHeartbeat(point);
    await this.tags.save(tag);

    const s = tag.snapshot;
    if (s.status === 'lost' && s.ownerId) {
      this.bus.publishToUser(s.ownerId, 'tag:seen', {
        code: s.code,
        point,
        seenAt: s.lastSeenAt?.toISOString(),
      });
    }
  }
}
