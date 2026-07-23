import { Schema, model } from 'mongoose';

import type { BookmarkSnapshot } from '../../../../domain/bookmark/bookmark.entity.js';

export type BookmarkDoc = Omit<BookmarkSnapshot, 'id'> & { _id: string };

const bookmarkSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
bookmarkSchema.index({ userId: 1, itemId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export const BookmarkModel = model<BookmarkDoc>('Bookmark', bookmarkSchema);
