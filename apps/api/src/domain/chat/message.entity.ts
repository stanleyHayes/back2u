import type { Id } from '../shared/id.js';

export interface MessageSnapshot {
  id: Id;
  threadId: Id;
  authorId: Id;
  body: string;
  flagged: boolean;
  readBy: Id[];
  images: { url: string }[];
  createdAt: Date;
}

export class Message {
  private constructor(private state: MessageSnapshot) {}
  static rehydrate(s: MessageSnapshot): Message {
    return new Message({ ...s });
  }
  static post(input: { id: Id; threadId: Id; authorId: Id; body: string; flagged?: boolean; images?: { url: string }[] }): Message {
    return new Message({
      ...input,
      flagged: input.flagged ?? false,
      readBy: [],
      images: input.images ?? [],
      createdAt: new Date(),
    });
  }
  get snapshot(): MessageSnapshot {
    return { ...this.state };
  }
  markRead(userId: Id): void {
    if (!this.state.readBy.includes(userId)) {
      this.state.readBy.push(userId);
    }
  }
}
