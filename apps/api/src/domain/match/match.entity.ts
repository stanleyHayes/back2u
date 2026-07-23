import type { MatchStatus } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface MatchSnapshot {
  id: Id;
  lostItemId: Id;
  foundItemId: Id;
  imageScore: number;
  textScore: number;
  geoScore: number;
  timeScore: number;
  score: number;
  status: MatchStatus;
  returnConfirmedByLost?: Id;
  returnConfirmedByFound?: Id;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Match {
  private constructor(private state: MatchSnapshot) {}

  static rehydrate(state: MatchSnapshot): Match {
    return new Match({ ...state });
  }

  static suggest(input: {
    id: Id;
    lostItemId: Id;
    foundItemId: Id;
    imageScore: number;
    textScore: number;
    geoScore: number;
    timeScore: number;
  }): Match {
    const score = scoreOf(input.imageScore, input.textScore, input.geoScore, input.timeScore);
    const now = new Date();
    return new Match({
      ...input,
      score,
      status: 'suggested',
      createdAt: now,
      updatedAt: now,
    });
  }

  get snapshot(): MatchSnapshot {
    return { ...this.state };
  }

  accept(): void {
    this.state.status = 'accepted';
    this.state.updatedAt = new Date();
  }
  reject(): void {
    this.state.status = 'rejected';
    this.state.updatedAt = new Date();
  }
  verify(): void {
    this.state.status = 'verified';
    this.state.updatedAt = new Date();
  }

  confirmReturnByLost(userId: Id): void {
    this.state.returnConfirmedByLost = userId;
    this.state.updatedAt = new Date();
  }

  confirmReturnByFound(userId: Id): void {
    this.state.returnConfirmedByFound = userId;
    this.state.updatedAt = new Date();
  }

  markReturned(): void {
    this.state.returnedAt = new Date();
    this.state.updatedAt = new Date();
  }
}

const W = { image: 0.4, text: 0.3, geo: 0.2, time: 0.1 } as const;

function scoreOf(image: number, text: number, geo: number, time: number): number {
  return Math.min(1, Math.max(0, image * W.image + text * W.text + geo * W.geo + time * W.time));
}
