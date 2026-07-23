import { injectable } from 'inversify';

import type { IMarketplaceListingRepository } from '../../../../application/ports/repositories.js';
import {
  Bid,
  MarketplaceListing,
  type BidSnapshot,
  type MarketplaceListingSnapshot,
} from '../../../../domain/marketplace_listing/marketplace-listing.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  BidModel,
  MarketplaceListingModel,
  type BidDoc,
  type MarketplaceListingDoc,
} from '../models/marketplace.model.js';

const toListingSnapshot = (d: MarketplaceListingDoc): MarketplaceListingSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

const toBidSnapshot = (d: BidDoc): BidSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoMarketplaceListingRepository implements IMarketplaceListingRepository {
  async save(l: MarketplaceListing): Promise<void> {
    const { id, ...rest } = l.snapshot;
    await MarketplaceListingModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async saveBid(b: Bid): Promise<void> {
    const { id, ...rest } = b.snapshot;
    await BidModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<MarketplaceListing | null> {
    const doc = await MarketplaceListingModel.findById(id).lean<MarketplaceListingDoc | null>();
    return doc ? MarketplaceListing.rehydrate(toListingSnapshot(doc)) : null;
  }

  async findBidById(id: Id): Promise<Bid | null> {
    const doc = await BidModel.findById(id).lean<BidDoc | null>();
    return doc ? Bid.rehydrate(toBidSnapshot(doc)) : null;
  }

  async listLive(limit: number): Promise<MarketplaceListing[]> {
    const docs = await MarketplaceListingModel.find({ status: 'live' })
      .sort({ closesAt: 1 })
      .limit(limit)
      .lean<MarketplaceListingDoc[]>();
    return docs.map((d) => MarketplaceListing.rehydrate(toListingSnapshot(d)));
  }

  async listBids(listingId: Id): Promise<Bid[]> {
    const docs = await BidModel.find({ listingId }).sort({ amount: -1, createdAt: 1 }).lean<BidDoc[]>();
    return docs.map((d) => Bid.rehydrate(toBidSnapshot(d)));
  }

  async listBidsForUser(userId: Id): Promise<Bid[]> {
    const docs = await BidModel.find({ bidderId: userId }).sort({ createdAt: -1 }).lean<BidDoc[]>();
    return docs.map((d) => Bid.rehydrate(toBidSnapshot(d)));
  }

  async count(): Promise<{ listings: number; bids: number }> {
    const [listings, bids] = await Promise.all([
      MarketplaceListingModel.countDocuments(),
      BidModel.countDocuments(),
    ]);
    return { listings, bids };
  }
}
