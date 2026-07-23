import { ValidationError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface ReviewSnapshot {
  id: Id;
  reviewerId: Id;
  revieweeId: Id;
  itemId: Id;
  matchId: Id;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export class Review {
  private constructor(private state: ReviewSnapshot) {}

  static rehydrate(state: ReviewSnapshot): Review {
    return new Review({ ...state });
  }

  static create(input: Omit<ReviewSnapshot, 'createdAt'>): Review {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ValidationError('rating must be an integer between 1 and 5');
    }
    return new Review({
      ...input,
      createdAt: new Date(),
    });
  }

  get snapshot(): ReviewSnapshot {
    return { ...this.state };
  }
}
