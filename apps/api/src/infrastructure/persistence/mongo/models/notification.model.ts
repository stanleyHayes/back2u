import { Schema, model } from 'mongoose';

import type { NotificationSnapshot } from '../../../../domain/notification/notification.entity.js';

export type NotificationDoc = Omit<NotificationSnapshot, 'id'> & { _id: string };

const notificationSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ['match', 'message', 'courier', 'marketplace', 'tag', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    url: { type: String },
    read: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const NotificationModel = model<NotificationDoc>('Notification', notificationSchema);
