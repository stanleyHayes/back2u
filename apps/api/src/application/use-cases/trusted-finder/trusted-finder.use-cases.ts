import type {
  ApplyTrustedFinderInput,
  TrustedFinderApplicationDTO,
  TrustedFinderApplicationStatus,
  UserDTO,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { ConflictError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { TrustedFinderApplication } from '../../../domain/trusted-finder/trusted-finder-application.entity.js';
import type { User } from '../../../domain/user/user.entity.js';
import type { ITrustedFinderApplicationRepository, IUserRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(a: TrustedFinderApplication): TrustedFinderApplicationDTO {
  const s = a.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    status: s.status,
    reason: s.reason,
    idPhotoUrl: s.idPhotoUrl,
    bio: s.bio,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
  };
}

function toUserDTO(u: User): UserDTO {
  const s = u.snapshot;
  return {
    id: s.id,
    email: s.email,
    name: s.name,
    phone: s.phone,
    avatarUrl: s.avatarUrl,
    roles: s.roles,
    status: s.status,
    reputationScore: s.reputationScore,
    pointsBalance: s.pointsBalance,
    successfulReturns: s.successfulReturns,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    emailVerified: s.emailVerified,
    phoneVerified: s.phoneVerified,
    trustedFinder: s.trustedFinder,
    institutionId: s.institutionId,
    locale: s.locale,
    badges: s.badges,
    pushTokens: s.pushTokens,
    emailPreferences: s.emailPreferences,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class ApplyTrustedFinderUseCase {
  constructor(
    @inject(TOKENS.TrustedFinderApplicationRepository) private readonly apps: ITrustedFinderApplicationRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
  ) {}
  async execute(userId: Id, input: ApplyTrustedFinderInput): Promise<TrustedFinderApplicationDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (user.snapshot.trustedFinder) throw new ConflictError('Already a trusted finder');
    const pending = await this.apps.findPendingByUserId(userId);
    if (pending) throw new ConflictError('Application already pending');
    const app = TrustedFinderApplication.create({
      id: newId(),
      userId,
      idPhotoUrl: input.idPhotoUrl,
      bio: input.bio,
    });
    await this.apps.save(app);
    return toDTO(app);
  }
}

@injectable()
export class ListTrustedFinderApplicationsUseCase {
  constructor(
    @inject(TOKENS.TrustedFinderApplicationRepository) private readonly apps: ITrustedFinderApplicationRepository,
  ) {}
  async execute(status?: TrustedFinderApplicationStatus, limit = 100): Promise<TrustedFinderApplicationDTO[]> {
    const list = await this.apps.list(status, limit);
    return list.map(toDTO);
  }
}

@injectable()
export class DecideTrustedFinderApplicationUseCase {
  constructor(
    @inject(TOKENS.TrustedFinderApplicationRepository) private readonly apps: ITrustedFinderApplicationRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
  ) {}
  async execute(
    applicationId: Id,
    decision: 'approved' | 'rejected',
    reason?: string,
  ): Promise<{ application: TrustedFinderApplicationDTO; user?: UserDTO }> {
    const app = await this.apps.findById(applicationId);
    if (!app) throw new NotFoundError('Application');
    if (app.status !== 'pending') throw new ConflictError('Application already decided');
    app.decide(decision, reason);
    await this.apps.save(app);

    let userDTO: UserDTO | undefined;
    if (decision === 'approved') {
      const user = await this.users.findById(app.userId);
      if (user) {
        user.promoteTrustedFinder();
        await this.users.save(user);
        userDTO = toUserDTO(user);
      }
    }
    return { application: toDTO(app), user: userDTO };
  }
}
