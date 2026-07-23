import { injectable } from 'inversify';

import type { INotificationRepository } from '../../../../application/ports/repositories.js';
import { Notification, type NotificationSnapshot } from '../../../../domain/notification/notification.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { NotificationModel, type NotificationDoc } from '../models/notification.model.js';

function toSnapshot(d: NotificationDoc): NotificationSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

@injectable()
export class MongoNotificationRepository implements INotificationRepository {
  async save(n: Notification): Promise<void> {
    const { id, ...rest } = n.snapshot;
    await NotificationModel.updateOne({ _id: id }, { $set: { _id: id, ...rest } }, { upsert: true });
  }

  async findById(id: Id): Promise<Notification | null> {
    const doc = await NotificationModel.findById(id).lean<NotificationDoc>();
    return doc ? Notification.rehydrate(toSnapshot(doc)) : null;
  }

  async listForUser(userId: Id, limit: number): Promise<Notification[]> {
    const docs = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<NotificationDoc[]>();
    return docs.map((d) => Notification.rehydrate(toSnapshot(d)));
  }

  async markRead(id: Id): Promise<void> {
    await NotificationModel.updateOne({ _id: id }, { $set: { read: true } });
  }

  async markAllRead(userId: Id): Promise<void> {
    await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
  }

  async countUnread(userId: Id): Promise<number> {
    return NotificationModel.countDocuments({ userId, read: false });
  }
}
