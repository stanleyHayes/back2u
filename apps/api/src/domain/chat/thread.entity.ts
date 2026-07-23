import type { Id } from '../shared/id.js';

export interface ThreadSnapshot {
  id: Id;
  itemId: Id;
  matchId?: Id;
  participantIds: Id[];
  lastMessageAt: Date;
  createdAt: Date;
}

export class Thread {
  private constructor(private state: ThreadSnapshot) {}
  static rehydrate(s: ThreadSnapshot): Thread {
    return new Thread({ ...s });
  }
  static open(input: { id: Id; itemId: Id; matchId?: Id; participantIds: Id[] }): Thread {
    const now = new Date();
    return new Thread({ ...input, lastMessageAt: now, createdAt: now });
  }
  get snapshot(): ThreadSnapshot {
    return { ...this.state };
  }
  touch(): void {
    this.state.lastMessageAt = new Date();
  }
  hasParticipant(userId: Id): boolean {
    return this.state.participantIds.includes(userId);
  }
}
