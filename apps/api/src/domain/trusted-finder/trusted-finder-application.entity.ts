import type { Id } from '../shared/id.js';

export interface TrustedFinderApplicationSnapshot {
  id: Id;
  userId: Id;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  idPhotoUrl: string;
  bio?: string;
  createdAt: Date;
  decidedAt?: Date;
}

export class TrustedFinderApplication {
  private constructor(private state: TrustedFinderApplicationSnapshot) {}

  static rehydrate(s: TrustedFinderApplicationSnapshot): TrustedFinderApplication {
    return new TrustedFinderApplication({ ...s });
  }

  static create(input: {
    id: Id;
    userId: Id;
    idPhotoUrl: string;
    bio?: string;
  }): TrustedFinderApplication {
    return new TrustedFinderApplication({
      ...input,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  get snapshot(): TrustedFinderApplicationSnapshot {
    return { ...this.state };
  }

  get id(): Id {
    return this.state.id;
  }

  get userId(): Id {
    return this.state.userId;
  }

  get status(): TrustedFinderApplicationSnapshot['status'] {
    return this.state.status;
  }

  decide(decision: 'approved' | 'rejected', reason?: string): void {
    this.state.status = decision;
    this.state.reason = reason;
    this.state.decidedAt = new Date();
  }
}
