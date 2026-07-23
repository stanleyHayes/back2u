import type {
  OwnershipVerificationDTO,
  SubmitVerificationInput,
  VerificationQuestion,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { OwnershipVerification } from '../../../domain/verification/verification.entity.js';
import type { IItemRepository, IVerificationRepository } from '../../ports/repositories.js';
import type { IAiVerificationService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const QUESTIONS: VerificationQuestion[] = [
  {
    id: 'describe',
    prompt: 'Describe the item in detail — colour, brand, size, and any unique marks or damage only the owner would know.',
  },
  {
    id: 'location_time',
    prompt: 'Where and when did you lose the item? Be as specific as possible.',
  },
  {
    id: 'identifiers',
    prompt: 'Provide any identifiers: serial number, IMEI, engraving, or distinguishing contents.',
  },
  {
    id: 'purchase',
    prompt: 'Where and when did you acquire the item? Include receipt or order details if available.',
  },
];

function toDTO(v: OwnershipVerification): OwnershipVerificationDTO {
  const s = v.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    claimantId: s.claimantId,
    answers: s.answers,
    proofs: s.proofs,
    aiConsistencyScore: s.aiConsistencyScore,
    status: s.status,
    reviewerId: s.reviewerId,
    reviewerNote: s.reviewerNote,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
  };
}

@injectable()
export class GetVerificationQuestionsUseCase {
  async execute(): Promise<VerificationQuestion[]> {
    return QUESTIONS;
  }
}

@injectable()
export class SubmitVerificationUseCase {
  constructor(
    @inject(TOKENS.VerificationRepository) private readonly repo: IVerificationRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.AiVerificationService) private readonly ai: IAiVerificationService,
  ) {}

  async execute(claimantId: Id, input: SubmitVerificationInput): Promise<OwnershipVerificationDTO> {
    const item = await this.items.findById(input.itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.postedById === claimantId) {
      throw new ForbiddenError('Cannot submit an ownership claim on your own listing');
    }
    const { score } = await this.ai.scoreClaimConsistency({
      item: {
        title: item.snapshot.title,
        description: item.snapshot.description,
        tags: item.snapshot.tags,
      },
      answers: input.answers.map((a) => ({
        questionId: a.questionId,
        prompt: QUESTIONS.find((q) => q.id === a.questionId)?.prompt ?? a.questionId,
        answer: a.answer,
      })),
      proofs: input.proofs,
    });
    const verification = OwnershipVerification.submit({
      id: newId(),
      itemId: input.itemId,
      claimantId,
      answers: input.answers,
      proofs: input.proofs,
      aiConsistencyScore: score,
    });
    await this.repo.save(verification);
    return toDTO(verification);
  }
}

@injectable()
export class DecideVerificationUseCase {
  constructor(@inject(TOKENS.VerificationRepository) private readonly repo: IVerificationRepository) {}

  async execute(
    id: Id,
    reviewerId: Id,
    decision: 'approve' | 'reject',
    note?: string,
  ): Promise<OwnershipVerificationDTO> {
    const verification = await this.repo.findById(id);
    if (!verification) throw new NotFoundError('Verification');
    if (decision === 'approve') {
      verification.approve(reviewerId, note);
    } else {
      if (!note) throw new ValidationError('A note is required when rejecting a verification');
      verification.reject(reviewerId, note);
    }
    await this.repo.save(verification);
    return toDTO(verification);
  }
}

@injectable()
export class ListPendingVerificationsUseCase {
  constructor(@inject(TOKENS.VerificationRepository) private readonly repo: IVerificationRepository) {}

  async execute(limit = 50): Promise<OwnershipVerificationDTO[]> {
    const list = await this.repo.listPending(limit);
    return list.map(toDTO);
  }
}
