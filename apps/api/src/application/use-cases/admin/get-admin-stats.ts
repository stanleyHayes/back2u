import type { AdminStatsDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type {
  ICourierJobRepository,
  IInstitutionRepository,
  IItemRepository,
  IMarketplaceListingRepository,
  IMatchRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

const STATS_WINDOW_DAYS = 30;

@injectable()
export class GetAdminStatsUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.MarketplaceListingRepository) private readonly marketplace: IMarketplaceListingRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.CourierJobRepository) private readonly courierJobs: ICourierJobRepository,
  ) {}
  async execute(): Promise<AdminStatsDTO> {
    const since = new Date(Date.now() - STATS_WINDOW_DAYS * 86_400_000);
    const [
      users,
      itemsByStatus,
      itemsByKind,
      itemsByCategory,
      mp,
      institutions,
      courierJobs,
      matchCounts,
      usersPerDay,
      itemsPerDay,
      matchesPerDay,
    ] = await Promise.all([
      this.users.count(),
      this.items.countByStatus(),
      this.items.countByKind(),
      this.items.countByCategory(),
      this.marketplace.count(),
      this.institutions.count(),
      this.courierJobs.count(),
      this.matches.count(),
      this.users.countPerDay(since),
      this.items.countPerDay(since),
      this.matches.countPerDay(since),
    ]);
    const itemsTotal = Object.values(itemsByStatus).reduce((sum, n) => sum + n, 0);
    return {
      users,
      itemsByStatus,
      itemsByKind,
      itemsByCategory,
      itemsTotal,
      marketplaceListings: mp.listings,
      marketplaceBids: mp.bids,
      institutions,
      courierJobs,
      matchesTotal: matchCounts.total,
      matchesAccepted: matchCounts.accepted,
      matchSuccessRate: matchCounts.total > 0 ? matchCounts.accepted / matchCounts.total : 0,
      usersPerDay: usersPerDay.map((d) => d.count),
      itemsPerDay: itemsPerDay.map((d) => d.count),
      matchesPerDay: matchesPerDay.map((d) => d.count),
    };
  }
}
