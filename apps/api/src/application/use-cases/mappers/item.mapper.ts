import type { ItemDTO } from '@back2u/shared-types';

import type { Item } from '../../../domain/item/item.entity.js';

export function toItemDTO(item: Item, opts?: { bookmarkCount?: number }): ItemDTO {
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
    bookmarkCount: opts?.bookmarkCount,
  };
}
