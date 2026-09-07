import type { Container } from 'inversify';
import mongoose from 'mongoose';

import { CrowdsourcedHeartbeatUseCase } from '../../application/use-cases/ble/heartbeat.use-case.js';
import { GenerateMatchesUseCase } from '../../application/use-cases/match/generate-matches.js';
import { SettleMarketplaceAuctionUseCase } from '../../application/use-cases/marketplace/marketplace.use-cases.js';
import { ClearPendingPointsUseCase } from '../../application/use-cases/points/points.use-cases.js';
import { ExpireReservationsUseCase } from '../../application/use-cases/reward_catalog/reward-catalog.use-cases.js';
import type { IQueueWorker } from '../../application/ports/queue.js';
import type { IAppUrls, IWebPushService } from '../../application/ports/extra-services.js';
import type {
  IMarketplaceListingRepository,
  IUserRepository,
} from '../../application/ports/repositories.js';
import type {
  IEmailService,
  ILogger,
  IPushService,
  IRealtimeBus,
} from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import { CustodyRecordModel } from '../persistence/mongo/models/custody.model.js';
import { ItemModel } from '../persistence/mongo/models/item.model.js';
import { MarketplaceListingModel } from '../persistence/mongo/models/marketplace.model.js';
import type { IWebPushSubscriptionRepository } from '../persistence/mongo/repositories/web-push.repo.mongo.js';

const MS_PER_DAY = 86_400_000;

export function registerWorkerHandlers(c: Container): void {
  const worker = c.get<IQueueWorker>(TOKENS.QueueWorker);
  const logger = c.get<ILogger>(TOKENS.Logger);

  worker.on<{ itemId: string }>('match.generate', async ({ itemId }) => {
    await c.get(GenerateMatchesUseCase).execute(itemId);
  });

  worker.on<{ userIds: string[]; title: string; body: string; data?: Record<string, unknown> }>(
    'push.broadcast',
    async (data) => {
      const push = c.get<IPushService>(TOKENS.PushService);
      const users = c.get<IUserRepository>(TOKENS.UserRepository);
      for (const userId of data.userIds) {
        const user = await users.findById(userId);
        if (user && user.snapshot.pushTokens.length > 0) {
          await push
            .send(user.snapshot.pushTokens, data.title, data.body, data.data)
            .catch((err) =>
              logger.warn('push.broadcast send failed', { userId, err: String(err) }),
            );
        }
      }
    },
  );

  worker.on<{ userId: string; title: string; body: string; data?: Record<string, unknown> }>(
    'webpush.send',
    async (data) => {
      const webPush = c.get<IWebPushService>(TOKENS.WebPushService);
      const subs = c.get<IWebPushSubscriptionRepository>(TOKENS.WebPushSubscriptionRepository);
      const list = await subs.listForUser(data.userId);
      for (const sub of list) {
        // WebPushService.send handles/logs delivery failures internally.
        await webPush.send(
          { endpoint: sub.snapshot.endpoint, keys: sub.snapshot.keys },
          data.title,
          data.body,
          data.data,
        );
      }
    },
  );

  worker.on<{ tagCode: string; lng: number; lat: number }>('zone.fanout', async (data) => {
    // Reuse heartbeat use-case for tag-driven alerts; zone-alert fan-out
    // happens directly in CreateItem for now, but lives here for queue-mode.
    await c
      .get(CrowdsourcedHeartbeatUseCase)
      .execute({ tagCode: data.tagCode, point: { lng: data.lng, lat: data.lat } });
  });

  worker.on('audit.write', async () => {
    logger.info('audit job pulled (handler is a noop — actual writes are sync)');
  });

  // ── Scheduler jobs (idempotent) ───────────────────────────────────────────

  worker.on('points.clear-pending', async () => {
    if (mongoose.connection.readyState !== 1) return;
    await c.get(ClearPendingPointsUseCase).execute();
  });

  worker.on('rewards.expire-reservations', async () => {
    if (mongoose.connection.readyState !== 1) return;
    await c.get(ExpireReservationsUseCase).execute();
  });

  worker.on('marketplace.auto-close', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const now = new Date();
    const expired = await MarketplaceListingModel.find({
      status: 'live',
      closesAt: { $lte: now },
    }).lean<{ _id: string }[]>();
    for (const doc of expired) {
      try {
        const result = await c.get(SettleMarketplaceAuctionUseCase).execute(doc._id);
        logger.info('marketplace.auto-close', {
          listingId: doc._id,
          winnerId: result.winnerId,
          winningAmount: result.winningAmount,
        });
      } catch (err) {
        logger.error('marketplace.auto-close', {
          listingId: doc._id,
          error: (err as Error).message,
        });
      }
    }
  });

  worker.on('marketplace.ending-soon', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const now = new Date();
    const repo = c.get<IMarketplaceListingRepository>(TOKENS.MarketplaceListingRepository);
    const bus = c.get<IRealtimeBus>(TOKENS.RealtimeBus);

    // 24h reminder window
    const win24Start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const win24End = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const listings24h = await MarketplaceListingModel.find({
      status: 'live',
      closesAt: { $gte: win24Start, $lte: win24End },
      reminder24hSent: { $ne: true },
    }).lean<{ _id: string; closesAt: Date }[]>();

    for (const doc of listings24h) {
      try {
        const bids = await repo.listBids(doc._id);
        const bidderIds = [...new Set(bids.map((b) => b.snapshot.bidderId))];
        for (const bidderId of bidderIds) {
          bus.publishToUser(bidderId, 'marketplace:ending_soon', {
            listingId: doc._id,
            closesAt: doc.closesAt,
            hoursLeft: 24,
          });
        }
        await MarketplaceListingModel.updateOne(
          { _id: doc._id },
          { $set: { reminder24hSent: true } },
        );
        logger.info('marketplace.ending-soon', {
          listingId: doc._id,
          hoursLeft: 24,
          biddersNotified: bidderIds.length,
        });
      } catch (err) {
        logger.error('marketplace.ending-soon', {
          listingId: doc._id,
          hoursLeft: 24,
          error: (err as Error).message,
        });
      }
    }

    // 1h reminder window
    const win1Start = new Date(now.getTime() + 55 * 60 * 1000);
    const win1End = new Date(now.getTime() + 65 * 60 * 1000);
    const listings1h = await MarketplaceListingModel.find({
      status: 'live',
      closesAt: { $gte: win1Start, $lte: win1End },
      reminder1hSent: { $ne: true },
    }).lean<{ _id: string; closesAt: Date }[]>();

    for (const doc of listings1h) {
      try {
        const bids = await repo.listBids(doc._id);
        const bidderIds = [...new Set(bids.map((b) => b.snapshot.bidderId))];
        for (const bidderId of bidderIds) {
          bus.publishToUser(bidderId, 'marketplace:ending_soon', {
            listingId: doc._id,
            closesAt: doc.closesAt,
            hoursLeft: 1,
          });
        }
        await MarketplaceListingModel.updateOne(
          { _id: doc._id },
          { $set: { reminder1hSent: true } },
        );
        logger.info('marketplace.ending-soon', {
          listingId: doc._id,
          hoursLeft: 1,
          biddersNotified: bidderIds.length,
        });
      } catch (err) {
        logger.error('marketplace.ending-soon', {
          listingId: doc._id,
          hoursLeft: 1,
          error: (err as Error).message,
        });
      }
    }
  });

  worker.on('items.auto-archive', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const now = new Date();

    // An item sitting in a Recovery Point bin is not abandoned — archiving it
    // would desynchronise the item from its open custody record, leaving staff
    // holding property the platform thinks is gone.
    //
    // Narrow to the items actually about to be archived before asking which are
    // in custody: a `$nin` built from every held record in the network would
    // grow without bound as the Recovery Point network scales.
    const fallbackExpiry = new Date(now.getTime() - 30 * MS_PER_DAY);
    const expiredFilter: Record<string, unknown> = {
      status: 'open',
      $or: [
        { expiresAt: { $lte: now } },
        { expiresAt: { $exists: false }, createdAt: { $lte: fallbackExpiry } },
      ],
    };
    const candidates = await ItemModel.find(expiredFilter)
      .select({ _id: 1 })
      .lean<{ _id: string }[]>();
    const candidateIds = candidates.map((d) => d._id);

    let archived = { modifiedCount: 0 };
    if (candidateIds.length > 0) {
      const held = await CustodyRecordModel.find({
        status: 'held',
        itemId: { $in: candidateIds },
      })
        .select({ itemId: 1 })
        .lean<{ itemId: string }[]>();
      const heldIds = new Set(held.map((r) => r.itemId));
      const archivable = candidateIds.filter((id) => !heldIds.has(id));
      if (archivable.length > 0) {
        archived = await ItemModel.updateMany(
          { _id: { $in: archivable }, status: 'open' },
          { $set: { status: 'archived', updatedAt: now } },
        );
      }
    }
    if (archived.modifiedCount)
      logger.info('items.auto-archive', { count: archived.modifiedCount });

    // Send reminders only once per day at 09:00 UTC to avoid duplicates
    if (now.getUTCHours() !== 9) return;

    const email = c.get<IEmailService>(TOKENS.EmailService);
    const users = c.get<IUserRepository>(TOKENS.UserRepository);
    const appUrls = c.get<IAppUrls>(TOKENS.AppUrls);

    // 3-day reminder window: expiresAt between 3d-1h and 3d
    const threeDayEnd = new Date(now.getTime() + 3 * MS_PER_DAY);
    const threeDayStart = new Date(threeDayEnd.getTime() - MS_PER_DAY);
    const threeDayItems = await ItemModel.find({
      status: 'open',
      expiresAt: { $gte: threeDayStart, $lte: threeDayEnd },
    }).lean();

    for (const doc of threeDayItems) {
      const owner = await users.findById(doc.postedById);
      if (owner) {
        void email
          .sendExpiryReminder(
            owner.email,
            owner.snapshot.name,
            doc.title,
            appUrls.itemDetail(doc._id),
            owner.snapshot.locale,
          )
          .catch(() => {});
      }
    }

    // 1-day urgent reminder window: expiresAt between 1d-1h and 1d
    const oneDayEnd = new Date(now.getTime() + 1 * MS_PER_DAY);
    const oneDayStart = new Date(oneDayEnd.getTime() - MS_PER_DAY);
    const oneDayItems = await ItemModel.find({
      status: 'open',
      expiresAt: { $gte: oneDayStart, $lte: oneDayEnd },
    }).lean();

    for (const doc of oneDayItems) {
      const owner = await users.findById(doc.postedById);
      if (owner) {
        void email
          .sendUrgentExpiryReminder(
            owner.email,
            owner.snapshot.name,
            doc.title,
            appUrls.itemDetail(doc._id),
            owner.snapshot.locale,
          )
          .catch(() => {});
      }
    }
  });
}
