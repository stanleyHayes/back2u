import type { CreateReviewInput, ReviewDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { Review } from '../../../domain/review/review.entity.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IItemRepository, IMatchRepository, IReviewRepository, IUserRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(r: Review): ReviewDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    reviewerId: s.reviewerId,
    revieweeId: s.revieweeId,
    itemId: s.itemId,
    matchId: s.matchId,
    rating: s.rating,
    comment: s.comment,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class CreateReviewUseCase {
  constructor(
    @inject(TOKENS.ReviewRepository) private readonly reviews: IReviewRepository,
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
  ) {}

  async execute(reviewerId: Id, input: CreateReviewInput): Promise<ReviewDTO> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ValidationError('rating must be an integer between 1 and 5');
    }
    const match = await this.matches.findById(input.matchId);
    if (!match) throw new NotFoundError('Match');
    const m = match.snapshot;

    const parties = await this.items.findByIds([m.lostItemId, m.foundItemId]);
    const lostOwner = parties.find((i) => i.id === m.lostItemId)?.snapshot.postedById;
    const foundOwner = parties.find((i) => i.id === m.foundItemId)?.snapshot.postedById;
    if (reviewerId !== lostOwner && reviewerId !== foundOwner) {
      throw new ForbiddenError('Only match participants can review');
    }
    const revieweeId = reviewerId === lostOwner ? foundOwner : lostOwner;
    if (!revieweeId) throw new NotFoundError('Reviewee');

    const existing = await this.reviews.findByReviewerAndMatch(reviewerId, input.matchId);
    if (existing) throw new ConflictError('Review already submitted for this match');

    const review = Review.create({
      id: newId(),
      reviewerId,
      revieweeId,
      itemId: m.lostItemId,
      matchId: m.id,
      rating: input.rating,
      comment: input.comment,
    });
    await this.reviews.save(review);

    const reviewee = await this.users.findById(revieweeId);
    if (reviewee) {
      const { count, average } = await this.reviews.countAndAverageForUser(revieweeId);
      reviewee.updateRating(average, count);
      await this.users.save(reviewee);
    }
    return toDTO(review);
  }
}

@injectable()
export class GetMyReviewForMatchUseCase {
  constructor(@inject(TOKENS.ReviewRepository) private readonly reviews: IReviewRepository) {}
  async execute(reviewerId: Id, matchId: Id): Promise<ReviewDTO | null> {
    const review = await this.reviews.findByReviewerAndMatch(reviewerId, matchId);
    return review ? toDTO(review) : null;
  }
}

@injectable()
export class ListReviewsForUserUseCase {
  constructor(@inject(TOKENS.ReviewRepository) private readonly reviews: IReviewRepository) {}
  async execute(userId: Id, limit = 50): Promise<ReviewDTO[]> {
    const list = await this.reviews.listForReviewee(userId, { limit });
    return list.map(toDTO);
  }
}
