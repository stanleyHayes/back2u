import {
  DEFAULT_CURRENCY,
  type BidDTO,
  type MarketplaceListingDTO,
  type MarketplaceListingItemDTO,
  type MarketplaceListingWithBidsDTO,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { Item } from '../../../domain/item/item.entity.js';
import { Bid, MarketplaceListing } from '../../../domain/marketplace_listing/marketplace-listing.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IItemRepository,
  IMarketplaceListingRepository,
  INotificationRepository,
} from '../../ports/repositories.js';
import type { IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const DEFAULT_DAYS_OPEN = 7;

function itemSummary(item: Item | null | undefined): MarketplaceListingItemDTO | undefined {
  if (!item) return undefined;
  const s = item.snapshot;
  return {
    title: s.title,
    category: s.category,
    kind: s.kind,
    imageUrl: s.images[0]?.url,
    placeName: s.place.name,
  };
}

function toDTO(listing: MarketplaceListing, item?: Item | null): MarketplaceListingDTO {
  const s = listing.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    startingPrice: s.startingPrice,
    currency: s.currency,
    buyNowPrice: s.buyNowPrice,
    closesAt: s.closesAt.toISOString(),
    status: s.status,
    highBidId: s.highBidId,
    charityRecipient: s.charityRecipient,
    item: itemSummary(item),
    createdAt: s.createdAt.toISOString(),
  };
}

function toBidDTO(bid: Bid): BidDTO {
  const s = bid.snapshot;
  return {
    id: s.id,
    listingId: s.listingId,
    bidderId: s.bidderId,
    amount: s.amount,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class ListUnclaimedAsAuctionUseCase {
  constructor(
    @inject(TOKENS.MarketplaceListingRepository) private readonly mp: IMarketplaceListingRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}
  async execute(input: {
    itemId: Id;
    startingPrice: number;
    buyNowPrice?: number;
    daysOpen?: number;
    charityRecipient?: string;
  }): Promise<MarketplaceListingDTO> {
    const item = await this.items.findById(input.itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.status === 'auctioned') throw new ConflictError('Item already auctioned');
    const listing = MarketplaceListing.list({
      id: newId(),
      itemId: input.itemId,
      startingPrice: input.startingPrice,
      currency: DEFAULT_CURRENCY,
      buyNowPrice: input.buyNowPrice,
      closesAt: new Date(Date.now() + (input.daysOpen ?? DEFAULT_DAYS_OPEN) * 86_400_000),
      charityRecipient: input.charityRecipient,
    });
    listing.goLive();
    await this.mp.save(listing);
    item.markAuctioned();
    await this.items.save(item);
    return toDTO(listing, item);
  }
}

@injectable()
export class PlaceBidUseCase {
  constructor(
    @inject(TOKENS.MarketplaceListingRepository) private readonly mp: IMarketplaceListingRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
  ) {}
  async execute(bidderId: Id, input: { listingId: Id; amount: number }): Promise<BidDTO> {
    const listing = await this.mp.findById(input.listingId);
    if (!listing) throw new NotFoundError('Listing');
    const s = listing.snapshot;
    if (s.status !== 'live') throw new ConflictError('Listing not live');
    if (s.closesAt.getTime() <= Date.now()) throw new ConflictError('Auction has closed');
    if (input.amount <= s.startingPrice) throw new ValidationError('Bid must exceed the starting price');
    const previous = s.highBidId ? await this.mp.findBidById(s.highBidId) : null;
    if (previous && input.amount <= previous.snapshot.amount) {
      throw new ValidationError('Bid must exceed the current high bid');
    }
    const bid = Bid.place({ id: newId(), listingId: input.listingId, bidderId, amount: input.amount });
    await this.mp.saveBid(bid);
    listing.recordBid(bid.snapshot.id);
    await this.mp.save(listing);
    if (previous && previous.snapshot.bidderId !== bidderId) {
      await this.notifications.save(
        Notification.create({
          id: newId(),
          userId: previous.snapshot.bidderId,
          type: 'marketplace',
          title: 'You were outbid',
          body: `Your bid of ${previous.snapshot.amount} was outbid. The new high bid is ${input.amount}.`,
          data: { listingId: input.listingId, amount: input.amount },
        }),
      );
    }
    return toBidDTO(bid);
  }
}

@injectable()
export class ListLiveMarketplaceUseCase {
  constructor(
    @inject(TOKENS.MarketplaceListingRepository) private readonly mp: IMarketplaceListingRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}
  async execute(limit = 50): Promise<MarketplaceListingDTO[]> {
    const listings = await this.mp.listLive(limit);
    const items = await this.items.findByIds(listings.map((l) => l.snapshot.itemId));
    const byId = new Map(items.map((i) => [i.id, i]));
    return listings.map((l) => toDTO(l, byId.get(l.snapshot.itemId) ?? null));
  }
}

@injectable()
export class ListMyBidsUseCase {
  constructor(@inject(TOKENS.MarketplaceListingRepository) private readonly mp: IMarketplaceListingRepository) {}
  async execute(userId: Id): Promise<BidDTO[]> {
    const bids = await this.mp.listBidsForUser(userId);
    return bids.map(toBidDTO);
  }
}

@injectable()
export class GetMarketplaceListingUseCase {
  constructor(
    @inject(TOKENS.MarketplaceListingRepository) private readonly mp: IMarketplaceListingRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}
  async execute(id: Id): Promise<MarketplaceListingWithBidsDTO> {
    const listing = await this.mp.findById(id);
    if (!listing) throw new NotFoundError('Listing');
    const [item, bids] = await Promise.all([
      this.items.findById(listing.snapshot.itemId),
      this.mp.listBids(id),
    ]);
    return { listing: toDTO(listing, item), bids: bids.map(toBidDTO) };
  }
}

@injectable()
export class SettleMarketplaceAuctionUseCase {
  constructor(
    @inject(TOKENS.MarketplaceListingRepository) private readonly mp: IMarketplaceListingRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}
  async execute(listingId: Id): Promise<{ winnerId?: Id; winningAmount: number }> {
    const listing = await this.mp.findById(listingId);
    if (!listing) throw new NotFoundError('Listing');
    if (listing.snapshot.status !== 'live') throw new ConflictError('Listing not live');

    const highBidId = listing.closeAuction();
    await this.mp.save(listing);

    if (highBidId) {
      const bid = await this.mp.findBidById(highBidId);
      if (!bid) throw new NotFoundError('Bid');
      const winnerId = bid.snapshot.bidderId;
      const winningAmount = bid.snapshot.amount;

      const item = await this.items.findById(listing.snapshot.itemId);
      const sellerId = item?.snapshot.postedById;

      this.bus.publishToUser(winnerId, 'marketplace:settled', { type: 'won', listingId, amount: winningAmount });
      if (sellerId) {
        this.bus.publishToUser(sellerId, 'marketplace:settled', {
          type: 'sold',
          listingId,
          amount: winningAmount,
          winnerId,
        });
      }

      return { winnerId, winningAmount };
    }

    return { winnerId: undefined, winningAmount: listing.snapshot.startingPrice };
  }
}
