import type { Id } from '../shared/id.js';

export type NotificationType = 'match' | 'message' | 'courier' | 'marketplace' | 'tag' | 'system';

export interface NotificationSnapshot {
  id: Id;
  userId: Id;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  url?: string;
  read: boolean;
  createdAt: Date;
}

export class Notification {
  private constructor(private state: NotificationSnapshot) {}

  static create(input: {
    id: Id;
    userId: Id;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    url?: string;
  }): Notification {
    return new Notification({
      ...input,
      read: false,
      createdAt: new Date(),
    });
  }

  static rehydrate(state: NotificationSnapshot): Notification {
    return new Notification({ ...state });
  }

  get snapshot(): NotificationSnapshot {
    return { ...this.state };
  }

  markRead(): void {
    this.state.read = true;
  }
}
