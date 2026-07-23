import type { Id } from '../shared/id.js';

export interface PartnerApiKeySnapshot {
  id: Id;
  institutionId: Id;
  keyHash: string;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export class PartnerApiKey {
  private constructor(private state: PartnerApiKeySnapshot) {}

  static create(input: Omit<PartnerApiKeySnapshot, 'createdAt'>): PartnerApiKey {
    return new PartnerApiKey({ ...input, createdAt: new Date() });
  }

  static rehydrate(s: PartnerApiKeySnapshot): PartnerApiKey {
    return new PartnerApiKey({ ...s });
  }

  get snapshot(): PartnerApiKeySnapshot {
    return { ...this.state };
  }

  markUsed(): void {
    this.state.lastUsedAt = new Date();
  }
}
