import type { Id } from '../shared/id.js';

export interface BookmarkSnapshot {
  id: Id;
  userId: Id;
  itemId: Id;
  createdAt: Date;
}

export class Bookmark {
  private constructor(private state: BookmarkSnapshot) {}

  static rehydrate(state: BookmarkSnapshot): Bookmark {
    return new Bookmark({ ...state });
  }

  static create(input: Omit<BookmarkSnapshot, 'createdAt'>): Bookmark {
    return new Bookmark({ ...input, createdAt: new Date() });
  }

  get snapshot(): BookmarkSnapshot {
    return { ...this.state };
  }
}
