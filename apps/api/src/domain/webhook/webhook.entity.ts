import type { Id } from '../shared/id.js';

export interface WebhookSnapshot {
  id: Id;
  institutionId: Id;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Webhook {
  private constructor(private state: WebhookSnapshot) {}

  static create(input: {
    id: Id;
    institutionId: Id;
    url: string;
    secret: string;
    events: string[];
  }): Webhook {
    const now = new Date();
    return new Webhook({
      ...input,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(state: WebhookSnapshot): Webhook {
    return new Webhook({ ...state });
  }

  get snapshot(): WebhookSnapshot {
    return { ...this.state };
  }

  update(patch: Partial<Pick<WebhookSnapshot, 'url' | 'events' | 'active'>>): void {
    if (patch.url !== undefined) this.state.url = patch.url;
    if (patch.events !== undefined) this.state.events = patch.events;
    if (patch.active !== undefined) this.state.active = patch.active;
    this.state.updatedAt = new Date();
  }
}
