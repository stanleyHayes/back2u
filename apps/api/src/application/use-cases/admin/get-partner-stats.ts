import type { ItemDTO, PartnerStatsDTO, RedemptionDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { Item } from '../../../domain/item/item.entity.js';
import type { PointsRedemption } from '../../../domain/redemption/redemption.entity.js';
import type { Id } from '../../../domain/shared/id.js';
import type { ICourierJobRepository, IItemRepository } from '../../ports/repositories.js';
import type { IRedemptionRepository } from '../../ports/redemption-repo.js';
import { TOKENS } from '../../ports/tokens.js';

const RECENT_LIMIT = 5;
const COURIER_ITEM_WINDOW = 1000;

function toItemDTO(item: Item): ItemDTO {
  const s = item.snapshot;
  return {
    id: s.id,
    kind: s.kind,
    classification: s.classification,
    status: s.status,
    title: s.title,
    description: s.description,
    category: s.category,
    tags: s.tags,
    images: s.images,
    place: s.place,
    occurredAt: s.occurredAt.toISOString(),
    postedById: s.postedById,
    rewardId: s.rewardId,
    institutionId: s.institutionId,
    qrTagCode: s.qrTagCode,
    perceptualHash: s.perceptualHash,
    duplicateOfId: s.duplicateOfId,
    policeCaseId: s.policeCaseId,
    serialNumber: s.serialNumber,
    imei: s.imei,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString(),
    bumpedAt: s.bumpedAt?.toISOString(),
    flaggedForReview: s.flaggedForReview,
  };
}

function toRedemptionDTO(r: PointsRedemption): RedemptionDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    institutionId: s.institutionId,
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
export class GetPartnerStatsUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.CourierJobRepository) private readonly courierJobs: ICourierJobRepository,
  ) {}
  async execute(institutionId: Id): Promise<PartnerStatsDTO> {
    const [itemCounts, recentItems, redemptionCounts, recentRedemptions, itemPage] = await Promise.all([
      this.items.countByInstitution(institutionId),
      this.items.listRecentByInstitution(institutionId, RECENT_LIMIT),
      this.redemptions.countByInstitution(institutionId),
      this.redemptions.listRecentByInstitution(institutionId, RECENT_LIMIT),
      this.items.list({ institutionId, page: 1, pageSize: COURIER_ITEM_WINDOW }),
    ]);
    const courier = await this.courierJobs.countByItemIds(itemPage.items.map((i) => i.id));
    const byStatus = itemCounts.byStatus;
    return {
      totalItems: itemCounts.total,
      openItems: byStatus['open'] ?? 0,
      matchedItems: byStatus['matched'] ?? 0,
      returnedItems: byStatus['returned'] ?? 0,
      itemsByStatus: byStatus,
      totalRedemptions: redemptionCounts.count,
      totalPointsRedeemed: redemptionCounts.totalPoints,
      totalCourierJobs: courier.total,
      activeCourierJobs: courier.active,
      recentItems: recentItems.map(toItemDTO),
      recentRedemptions: recentRedemptions.map(toRedemptionDTO),
    };
  }
}
