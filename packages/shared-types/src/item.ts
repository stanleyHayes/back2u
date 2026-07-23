import type { Classification, ItemKind, ItemStatus } from './enums.js';
import type { PlaceRef } from './geo.js';

export interface ItemImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface ItemDTO {
  id: string;
  kind: ItemKind;
  classification: Classification;
  status: ItemStatus;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: ItemImage[];
  place: PlaceRef;
  occurredAt: string; // ISO
  postedById: string;
  rewardId?: string;
  institutionId?: string;
  qrTagCode?: string;
  perceptualHash?: string;
  duplicateOfId?: string;
  policeCaseId?: string;
  serialNumber?: string;
  imei?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  bumpedAt?: string;
  flaggedForReview?: boolean;
  bookmarkCount?: number;
}

export interface CreateItemInput {
  kind: ItemKind;
  classification: Classification;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  images: ItemImage[];
  place: PlaceRef;
  occurredAt: string;
  rewardAmount?: number;
  institutionId?: string;
  qrTagCode?: string;
  serialNumber?: string;
  imei?: string;
}

export interface UpdateItemInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: ItemStatus;
  classification?: Classification;
}

export interface ItemListQuery {
  kind?: ItemKind;
  status?: ItemStatus;
  category?: string;
  near?: { lng: number; lat: number; radiusMeters: number };
  text?: string;
  search?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  postedById?: string;
  page?: number;
  pageSize?: number;
  cursor?: string;
}



export interface BookmarkDTO {
  id: string;
  userId: string;
  itemId: string;
  item: ItemDTO | null;
  createdAt: string;
}

export interface AutocompleteResult {
  cities: string[];
  categories: string[];
}
