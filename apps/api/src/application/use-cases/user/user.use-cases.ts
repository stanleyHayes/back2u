import type { UserDTO, UserRole } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { User } from '../../../domain/user/user.entity.js';
import type { IUserRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

const DEFAULT_LIMIT = 50;

function toDTO(user: User): UserDTO {
  const s = user.snapshot;
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
export class ListUsersUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}
  async execute(filter: { limit?: number; offset?: number; search?: string }): Promise<UserDTO[]> {
    const list = await this.users.list({ limit: filter.limit ?? DEFAULT_LIMIT, offset: filter.offset, search: filter.search });
    return list.map(toDTO);
  }
}

@injectable()
export class UpdateUserStatusUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}
  async execute(id: Id, status: 'active' | 'banned' | 'suspended'): Promise<UserDTO> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('User');
    user.updateStatus(status);
    await this.users.save(user);
    return toDTO(user);
  }
}

@injectable()
export class UpdateUserRolesUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}
  async execute(id: Id, roles: UserRole[]): Promise<UserDTO> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('User');
    user.updateRoles(roles);
    await this.users.save(user);
    return toDTO(user);
  }
}
