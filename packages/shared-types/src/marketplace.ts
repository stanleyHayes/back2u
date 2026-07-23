import type { MarketplaceListingStatus } from './enums.js';

/** Lightweight summary of the auctioned item, joined onto listings for display. */
export interface MarketplaceListingItemDTO {
  title: string;
  category: string;
  kind: 'lost' | 'found';
  imageUrl?: string;
  placeName?: string;
}

export interface MarketplaceListingDTO {
  id: string;
  itemId: string;
  startingPrice: number;
  currency: string;
  buyNowPrice?: number;
  closesAt: string;
  status: MarketplaceListingStatus;
  highBidId?: string;
  charityRecipient?: string;
  item?: MarketplaceListingItemDTO;
  createdAt: string;
}

export interface BidDTO {
  id: string;
  listingId: string;
  bidderId: string;
  amount: number;
  createdAt: string;
}

export interface MarketplaceListingWithBidsDTO {
  listing: MarketplaceListingDTO;
  bids: BidDTO[];
}

export interface PlaceBidInput {
  listingId: string;
  amount: number;
}
