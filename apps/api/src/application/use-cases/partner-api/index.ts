import { createHash, randomBytes } from 'node:crypto';

import type {
  CreateItemInput,
  CreatedPartnerApiKeyDTO,
  ItemDTO,
  ItemKind,
  ItemStatus,
  Paginated,
  PartnerApiKeyDTO,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { PartnerApiKey } from '../../../domain/institution/partner-api-key.entity.js';
import { Item } from '../../../domain/item/item.entity.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IInstitutionRepository,
  IItemRepository,
  IPartnerApiKeyRepository,
} from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

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

function toKeyDTO(key: PartnerApiKey): PartnerApiKeyDTO {
  const s = key.snapshot;
  return {
    id: s.id,
    institutionId: s.institutionId,
    name: s.name,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt?.toISOString(),
  };
}

export interface PartnerItemListQuery {
  kind?: ItemKind;
  status?: ItemStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

@injectable()
export class ListPartnerItemsUseCase {
  constructor(@inject(TOKENS.ItemRepository) private readonly items: IItemRepository) {}
  async execute(institutionId: Id, query: PartnerItemListQuery): Promise<Paginated<ItemDTO>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;
    const { items, total } = await this.items.list({
      institutionId,
      kind: query.kind,
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page,
      pageSize,
    });
    return { items: items.map(toItemDTO), page, pageSize, total };
  }
}

@injectable()
export class GetPartnerItemUseCase {
  constructor(@inject(TOKENS.ItemRepository) private readonly items: IItemRepository) {}
  async execute(institutionId: Id, itemId: Id): Promise<ItemDTO> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.institutionId !== institutionId) throw new ForbiddenError('Item belongs to another institution');
    return toItemDTO(item);
  }
}

@injectable()
export class CreatePartnerItemUseCase {
  constructor(@inject(TOKENS.ItemRepository) private readonly items: IItemRepository) {}
  async execute(institutionId: Id, input: CreateItemInput): Promise<ItemDTO> {
    const item = Item.create({
      id: newId(),
      kind: input.kind,
      classification: input.classification,
      title: input.title,
      description: input.description,
      category: input.category,
      tags: input.tags ?? [],
      images: input.images,
      place: input.place,
      occurredAt: new Date(input.occurredAt),
      postedById: institutionId,
      institutionId,
      qrTagCode: input.qrTagCode,
      serialNumber: input.serialNumber,
      imei: input.imei,
    });
    await this.items.save(item);
    return toItemDTO(item);
  }
}

@injectable()
export class UpdatePartnerItemStatusUseCase {
  constructor(@inject(TOKENS.ItemRepository) private readonly items: IItemRepository) {}
  async execute(institutionId: Id, itemId: Id, status: ItemStatus): Promise<ItemDTO> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.institutionId !== institutionId) throw new ForbiddenError('Item belongs to another institution');
    switch (status) {
      case 'matched': item.markMatched(); break;
      case 'claimed': item.markClaimed(); break;
      case 'returned': item.markReturned(); break;
      case 'closed': item.close(); break;
      case 'archived': item.archive(); break;
      case 'auctioned': item.markAuctioned(); break;
      case 'donated': item.markDonated(); break;
      default: throw new ValidationError(`Cannot set status to ${status}`);
    }
    await this.items.save(item);
    return toItemDTO(item);
  }
}

@injectable()
export class CreatePartnerApiKeyUseCase {
  constructor(
    @inject(TOKENS.PartnerApiKeyRepository) private readonly keys: IPartnerApiKeyRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
  ) {}
  async execute(institutionId: Id, name: string): Promise<CreatedPartnerApiKeyDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');
    const plainKey = `b2u_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(plainKey).digest('hex');
    const key = PartnerApiKey.create({ id: newId(), institutionId, keyHash, name });
    await this.keys.save(key);
    const s = key.snapshot;
    return {
      id: s.id,
      institutionId: s.institutionId,
      name: s.name,
      plainKey,
      createdAt: s.createdAt.toISOString(),
    };
  }
}

@injectable()
export class ListPartnerApiKeysUseCase {
  constructor(@inject(TOKENS.PartnerApiKeyRepository) private readonly keys: IPartnerApiKeyRepository) {}
  async execute(institutionId?: Id): Promise<PartnerApiKeyDTO[]> {
    const list = institutionId
      ? await this.keys.listByInstitution(institutionId)
      : await this.keys.listAll();
    return list.map(toKeyDTO);
  }
}

@injectable()
export class RevokePartnerApiKeyUseCase {
  constructor(@inject(TOKENS.PartnerApiKeyRepository) private readonly keys: IPartnerApiKeyRepository) {}
  async execute(id: Id): Promise<{ deleted: true }> {
    const key = await this.keys.findById(id);
    if (!key) throw new NotFoundError('API key');
    await this.keys.delete(id);
    return { deleted: true };
  }
}
