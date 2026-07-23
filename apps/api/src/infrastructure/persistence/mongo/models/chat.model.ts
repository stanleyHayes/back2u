import { Schema, model } from 'mongoose';

import type { MessageSnapshot } from '../../../../domain/chat/message.entity.js';
import type { ThreadSnapshot } from '../../../../domain/chat/thread.entity.js';

export type ThreadDoc = Omit<ThreadSnapshot, 'id'> & { _id: string };
export type MessageDoc = Omit<MessageSnapshot, 'id'> & { _id: string };

const threadSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    matchId: { type: String },
    participantIds: { type: [String], required: true, index: true },
    lastMessageAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
threadSchema.index({ participantIds: 1, lastMessageAt: -1 });

const messageSchema = new Schema(
  {
    _id: { type: String, required: true },
    threadId: { type: String, required: true },
    authorId: { type: String, required: true },
    body: { type: String, required: true },
    flagged: { type: Boolean, required: true, default: false },
    readBy: { type: [String], required: true, default: [] },
    images: {
      type: [new Schema({ url: { type: String, required: true } }, { _id: false })],
      required: true,
      default: [],
    },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
messageSchema.index({ threadId: 1, createdAt: 1 });

export const ThreadModel = model<ThreadDoc>('Thread', threadSchema);
export const MessageModel = model<MessageDoc>('Message', messageSchema);
