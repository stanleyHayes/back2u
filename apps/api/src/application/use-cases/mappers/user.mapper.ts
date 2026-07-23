import type { UserDTO } from '@back2u/shared-types';

import type { User } from '../../../domain/user/user.entity.js';

export const toUserDTO = (user: User): UserDTO => {
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
};
