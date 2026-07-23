import type { LeaderboardEntryDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { IUserRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class GetLeaderboardUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(limit = 50): Promise<LeaderboardEntryDTO[]> {
    const top = await this.users.topByPoints(limit);
    return top.map((u, i) => {
      const s = u.snapshot;
      return {
        userId: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
        pointsBalance: s.pointsBalance,
        reputationScore: s.reputationScore,
        successfulReturns: s.successfulReturns,
        rank: i + 1,
        badges: s.badges,
      };
    });
  }
}
