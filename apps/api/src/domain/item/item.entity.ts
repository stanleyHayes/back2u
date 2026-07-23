import {
  type Classification,
  type ItemImage,
  type ItemKind,
  type ItemStatus,
  type PlaceRef,
} from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface ItemSnapshot {
  id: Id;
  kind: ItemKind;
  classification: Classification;
  status: ItemStatus;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: ItemImage[];
  place: PlaceRef;
  occurredAt: Date;
  postedById: Id;
  rewardId?: Id;
  institutionId?: Id;
  qrTagCode?: string;
  policeCaseId?: Id;
  serialNumber?: string;
  imei?: string;
  duplicateOfId?: Id;
  perceptualHash?: string;
  textEmbedding?: number[];
  imageEmbedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  bumpedAt?: Date;
  flaggedForReview?: boolean;
}

export class Item {
  private constructor(private state: ItemSnapshot) {}

  static rehydrate(state: ItemSnapshot): Item {
    return new Item({ ...state });
  }

  static create(input: Omit<ItemSnapshot, 'createdAt' | 'updatedAt' | 'status' | 'expiresAt' | 'bumpedAt'>): Item {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 86_400_000);
    return new Item({ ...input, status: 'open', createdAt: now, updatedAt: now, expiresAt });
  }

  get snapshot(): ItemSnapshot {
    return { ...this.state };
  }
  get id(): Id {
    return this.state.id;
  }

  attachReward(rewardId: Id): void {
    if (this.state.rewardId) throw new ConflictError('Reward already attached');
    this.state.rewardId = rewardId;
    this.state.updatedAt = new Date();
  }
  attachPoliceCase(caseId: Id): void {
    this.state.policeCaseId = caseId;
    this.state.updatedAt = new Date();
  }
  markDuplicateOf(id: Id): void {
    this.state.duplicateOfId = id;
    this.state.updatedAt = new Date();
  }
  setPerceptualHash(hash: string): void {
    this.state.perceptualHash = hash;
    this.state.updatedAt = new Date();
  }
  markMatched(): void {
    if (this.state.status === 'returned' || this.state.status === 'closed') {
      throw new ConflictError(`Cannot mark matched from status=${this.state.status}`);
    }
    this.state.status = 'matched';
    this.state.updatedAt = new Date();
  }
  markClaimed(): void {
    this.state.status = 'claimed';
    this.state.updatedAt = new Date();
  }
  markReturned(): void {
    this.state.status = 'returned';
    this.state.updatedAt = new Date();
  }
  markAuctioned(): void {
    this.state.status = 'auctioned';
    this.state.updatedAt = new Date();
  }
  markDonated(): void {
    this.state.status = 'donated';
    this.state.updatedAt = new Date();
  }
  close(): void {
    this.state.status = 'closed';
    this.state.updatedAt = new Date();
  }
  bump(): void {
    if (this.state.status !== 'open') {
      throw new ConflictError('Cannot bump: item is not open');
    }
    const now = new Date();
    this.state.expiresAt = new Date(now.getTime() + 30 * 86_400_000);
    this.state.bumpedAt = now;
    this.state.updatedAt = now;
  }
  archive(): void {
    this.state.status = 'archived';
    this.state.updatedAt = new Date();
  }
  setEmbeddings(text?: number[], image?: number[]): void {
    if (text) this.state.textEmbedding = text;
    if (image) this.state.imageEmbedding = image;
    this.state.updatedAt = new Date();
  }
  flagForReview(): void {
    this.state.flaggedForReview = true;
    this.state.updatedAt = new Date();
  }
  clearReviewFlag(): void {
    this.state.flaggedForReview = false;
    this.state.updatedAt = new Date();
  }
  update(
    patch: Partial<
      Pick<ItemSnapshot, 'title' | 'description' | 'category' | 'tags' | 'classification'>
    >,
  ): void {
    Object.assign(this.state, patch);
    this.state.updatedAt = new Date();
  }
}
