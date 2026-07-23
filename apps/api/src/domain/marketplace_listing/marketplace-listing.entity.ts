import type { MarketplaceListingStatus } from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface MarketplaceListingSnapshot {
  id: Id;
  itemId: Id;
  startingPrice: number;
  currency: string;
  buyNowPrice?: number;
  closesAt: Date;
  status: MarketplaceListingStatus;
  highBidId?: Id;
  charityRecipient?: string;
  reminder24hSent?: boolean;
  reminder1hSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidSnapshot {
  id: Id;
  listingId: Id;
  bidderId: Id;
  amount: number;
  createdAt: Date;
}

export class MarketplaceListing {
  private constructor(private state: MarketplaceListingSnapshot) {}
  static rehydrate(s: MarketplaceListingSnapshot): MarketplaceListing {
    return new MarketplaceListing({ ...s });
  }
  static list(input: Omit<MarketplaceListingSnapshot, 'status' | 'createdAt' | 'updatedAt'>): MarketplaceListing {
    const now = new Date();
    return new MarketplaceListing({ ...input, status: 'pending', createdAt: now, updatedAt: now });
  }
  get snapshot(): MarketplaceListingSnapshot {
    return { ...this.state };
  }
  goLive(): void {
    if (this.state.status !== 'pending') throw new ConflictError(`status=${this.state.status}`);
    this.state.status = 'live';
    this.state.updatedAt = new Date();
  }
  recordBid(bidId: Id): void {
    if (this.state.status !== 'live') throw new ConflictError('Listing not live');
    this.state.highBidId = bidId;
    this.state.updatedAt = new Date();
  }
  close(soldOrDonated: 'sold' | 'donated' | 'withdrawn'): void {
    this.state.status = soldOrDonated;
    this.state.updatedAt = new Date();
  }
  closeAuction(): Id | undefined {
    if (this.state.status !== 'live') throw new ConflictError(`status=${this.state.status}`);
    if (!this.state.highBidId) {
      // No bids: cancel rather than marking the listing sold.
      this.cancel();
      return undefined;
    }
    this.state.status = 'sold';
    this.state.updatedAt = new Date();
    return this.state.highBidId;
  }
  cancel(): void {
    this.state.status = 'cancelled';
    this.state.updatedAt = new Date();
  }
  markReminderSent(type: '24h' | '1h'): void {
    if (type === '24h') this.state.reminder24hSent = true;
    else this.state.reminder1hSent = true;
    this.state.updatedAt = new Date();
  }
}

export class Bid {
  private constructor(private state: BidSnapshot) {}
  static rehydrate(s: BidSnapshot): Bid {
    return new Bid({ ...s });
  }
  static place(input: Omit<BidSnapshot, 'createdAt'>): Bid {
    return new Bid({ ...input, createdAt: new Date() });
  }
  get snapshot(): BidSnapshot {
    return { ...this.state };
  }
}
