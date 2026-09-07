import type {
  CreateRewardOfferInput,
  PartnerRewardAnalyticsDTO,
  RedemptionDTO,
  RewardOfferDTO,
  RewardOfferListingDTO,
  RewardOfferStatsDTO,
  UpdateRewardOfferInput,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { generate6DigitCode } from '../../../domain/auth/otp.entity.js';
import { PointLedgerEntry } from '../../../domain/points/point-ledger-entry.entity.js';
import { PointsRedemption } from '../../../domain/redemption/redemption.entity.js';
import {
  INELIGIBLE_MESSAGES,
  RewardOffer,
  toRewardOfferDTO,
  type IneligibleReason,
} from '../../../domain/reward_catalog/reward-offer.entity.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IPointLedgerRepository } from '../../ports/points-repos.js';
import type { IRedemptionRepository } from '../../ports/redemption-repo.js';
import type { IRewardOfferRepository } from '../../ports/reward-catalog-repos.js';
import type {
  IAuditLogRepository,
  IInstitutionRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { DEFAULT_CURRENCY } from '@back2u/shared-types';

/** How many lapsed reservations one sweep releases. */
const EXPIRY_BATCH_SIZE = 500;

function toRedemptionDTO(r: PointsRedemption, institutionName?: string): RedemptionDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    institutionId: s.institutionId,
    institutionName,
    points: s.points,
    value: s.value,
    currency: s.currency,
    code: s.code,
    status: s.status,
    note: s.note,
    offerId: s.offerId,
    offerTitle: s.offerTitle,
    expiresAt: s.expiresAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
    fulfilledAt: s.fulfilledAt?.toISOString(),
    resolvedAt: s.resolvedAt?.toISOString(),
  };
}

/** The member-facing catalogue, with each offer's eligibility resolved. */
@injectable()
export class ListRewardCatalogUseCase {
  constructor(
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
  ) {}

  async execute(
    userId: Id | undefined,
    opts: { limit: number; skip: number; institutionId?: Id },
  ): Promise<{ offers: RewardOfferListingDTO[]; total: number }> {
    const now = new Date();
    const { offers, total } = await this.offers.listLive(now, opts);
    const user = userId ? await this.users.findById(userId) : null;

    const names = new Map<Id, string>();
    const listings: RewardOfferListingDTO[] = [];

    for (const offer of offers) {
      const institutionId = offer.institutionId;
      if (!names.has(institutionId)) {
        const institution = await this.institutions.findById(institutionId);
        if (institution) names.set(institutionId, institution.snapshot.name);
      }

      let reason: IneligibleReason | null = offer.availability(now);
      if (!reason && user) {
        const s = user.snapshot;
        if (!offer.allowsTrustLevel(s.trustLevel)) {
          reason = 'trust_level';
        } else if (s.pointsBalance < offer.pointsCost) {
          reason = 'insufficient_points';
        } else if (offer.snapshot.perUserLimit !== undefined) {
          const held = await this.redemptions.countForUserAndOffer(user.id, offer.id);
          if (held >= offer.snapshot.perUserLimit) reason = 'per_user_limit';
        }
      }

      listings.push({
        ...toRewardOfferDTO(offer, names.get(institutionId)),
        // An anonymous browser sees the catalogue but no personal verdict.
        eligible: user ? reason === null : offer.availability(now) === null,
        ineligibleReason: reason ? INELIGIBLE_MESSAGES[reason] : undefined,
      });
    }

    return { offers: listings, total };
  }
}

/**
 * Reserves one unit of a catalogue offer for a member (spec §13 RESERVED).
 *
 * Spends the member's BakPoints and takes the stock immediately, then holds
 * both until the partner confirms the code at the counter. Taking the stock
 * only at collection would let the same unit be promised to several people.
 */
@injectable()
export class ReserveRewardUseCase {
  constructor(
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(userId: Id, offerId: Id): Promise<RedemptionDTO> {
    const [offer, user] = await Promise.all([
      this.offers.findById(offerId),
      this.users.findById(userId),
    ]);
    if (!offer) throw new NotFoundError('Reward');
    if (!user) throw new NotFoundError('User');

    const now = new Date();
    const unavailable = offer.availability(now);
    if (unavailable) throw new ConflictError(INELIGIBLE_MESSAGES[unavailable]);

    const s = user.snapshot;
    if (!offer.allowsTrustLevel(s.trustLevel)) {
      throw new ForbiddenError(INELIGIBLE_MESSAGES.trust_level);
    }
    if (s.pointsBalance < offer.pointsCost) {
      throw new ConflictError(INELIGIBLE_MESSAGES.insufficient_points);
    }
    const limit = offer.snapshot.perUserLimit;
    if (limit !== undefined) {
      const held = await this.redemptions.countForUserAndOffer(userId, offerId);
      if (held >= limit) throw new ConflictError(INELIGIBLE_MESSAGES.per_user_limit);
    }

    // Take the stock first: it is the contended resource, and losing the race
    // here must not have already spent the member's points.
    if (!(await this.offers.tryReserveStock(offerId))) {
      throw new ConflictError(INELIGIBLE_MESSAGES.sold_out);
    }

    const redemption = PointsRedemption.create({
      id: newId(),
      userId,
      institutionId: offer.institutionId,
      points: offer.pointsCost,
      // Catalogue rewards are partner-funded benefits, not a cash conversion,
      // so they carry no currency value (§13).
      value: 0,
      currency: DEFAULT_CURRENCY,
      code: generate6DigitCode(),
      offerId,
      offerTitle: offer.snapshot.title,
      expiresAt: offer.reservationExpiry(now),
    });

    try {
      await this.users.incrementPoints(userId, -offer.pointsCost);
      await this.redemptions.save(redemption);
      await this.ledger.save(
        PointLedgerEntry.settled({
          id: newId(),
          userId,
          action: 'redemption_spend',
          points: -offer.pointsCost,
          caseRef: redemption.id,
          resolutionNote: `Reserved "${offer.snapshot.title}"`,
          reasons: [{ code: 'base', detail: `Reward code ${redemption.snapshot.code}` }],
        }),
      );
    } catch (err) {
      // Put the unit back rather than leaving stock stranded on a failed spend.
      await this.offers.restoreStock(offerId).catch(() => {});
      throw err;
    }

    offer.recordReservation();
    const institution = await this.institutions.findById(offer.institutionId);
    this.logger.info('reward reserved', {
      offerId,
      userId,
      redemptionId: redemption.id,
      points: offer.pointsCost,
    });
    return toRedemptionDTO(redemption, institution?.snapshot.name);
  }
}

/**
 * Releases reservations nobody collected (spec §13 EXPIRED).
 *
 * Returns the member's points and the partner's stock. Doing one without the
 * other would either rob the member or quietly shrink the partner's inventory.
 */
@injectable()
export class ExpireReservationsUseCase {
  constructor(
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(now = new Date()): Promise<{ expired: number }> {
    const due = await this.redemptions.findDueReservations(now, EXPIRY_BATCH_SIZE);
    let expired = 0;

    for (const redemption of due) {
      const s = redemption.snapshot;
      try {
        // Close the reservation first, so a failure mid-refund cannot be
        // replayed into a second refund on the next sweep.
        redemption.expire(now);
        await this.redemptions.save(redemption);

        await this.users.incrementPoints(s.userId, s.points);
        await this.ledger.save(
          PointLedgerEntry.settled({
            id: newId(),
            userId: s.userId,
            action: 'admin_adjustment',
            points: s.points,
            caseRef: s.id,
            resolutionNote: `Refund: "${s.offerTitle ?? 'reward'}" was not collected in time`,
            reasons: [{ code: 'base', detail: 'Reservation expired' }],
          }),
        );
        if (s.offerId) await this.offers.restoreStock(s.offerId);
        expired += 1;
      } catch (err) {
        this.logger.error('reservation expiry failed', {
          redemptionId: s.id,
          error: (err as Error).message,
        });
      }
    }

    if (expired > 0) this.logger.info('rewards.expire-reservations', { due: due.length, expired });
    return { expired };
  }
}

// ── Partner catalogue management ──────────────────────────────────────────

@injectable()
export class CreateRewardOfferUseCase {
  constructor(
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(
    institutionId: Id,
    input: CreateRewardOfferInput,
    actorId: Id,
  ): Promise<RewardOfferDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');

    const offer = RewardOffer.create({ id: newId(), institutionId, ...input });
    await this.offers.save(offer);
    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'rewardOffer.create',
        entity: 'reward_offer',
        entityId: offer.id,
        meta: { institutionId, title: input.title, pointsCost: input.pointsCost },
      }),
    );
    return toRewardOfferDTO(offer, institution.snapshot.name);
  }
}

@injectable()
export class UpdateRewardOfferUseCase {
  constructor(
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(
    institutionId: Id,
    offerId: Id,
    input: UpdateRewardOfferInput,
    actorId: Id,
  ): Promise<RewardOfferDTO> {
    const offer = await this.offers.findById(offerId);
    if (!offer) throw new NotFoundError('Reward');
    if (offer.institutionId !== institutionId) {
      throw new ForbiddenError('That reward belongs to another organisation');
    }

    const before = toRewardOfferDTO(offer);
    offer.update(input);
    await this.offers.save(offer);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'rewardOffer.update',
        entity: 'reward_offer',
        entityId: offerId,
        meta: { changed: Object.keys(input), before, after: toRewardOfferDTO(offer) },
      }),
    );
    return toRewardOfferDTO(offer);
  }
}

@injectable()
export class ListPartnerRewardOffersUseCase {
  constructor(
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
  ) {}

  async execute(institutionId: Id): Promise<RewardOfferDTO[]> {
    const list = await this.offers.listForInstitution(institutionId);
    return list.map((o) => toRewardOfferDTO(o));
  }
}

/** Redemption analytics for the partner console (spec §13). */
@injectable()
export class GetPartnerRewardAnalyticsUseCase {
  constructor(
    @inject(TOKENS.RewardOfferRepository) private readonly offers: IRewardOfferRepository,
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
  ) {}

  async execute(institutionId: Id): Promise<PartnerRewardAnalyticsDTO> {
    const offers = await this.offers.listForInstitution(institutionId);

    const stats: RewardOfferStatsDTO[] = [];
    let totalReserved = 0;
    let totalRedeemed = 0;
    let totalPointsSpent = 0;

    for (const offer of offers) {
      const byStatus = await this.redemptions.statsForOffer(offer.id);
      const reserved = byStatus.pending?.count ?? 0;
      const redeemed = byStatus.fulfilled?.count ?? 0;
      const expired = byStatus.expired?.count ?? 0;
      const reversed = byStatus.reversed?.count ?? 0;
      const pointsSpent = byStatus.fulfilled?.points ?? 0;
      const settled = redeemed + expired;

      totalReserved += reserved;
      totalRedeemed += redeemed;
      totalPointsSpent += pointsSpent;

      stats.push({
        offerId: offer.id,
        title: offer.snapshot.title,
        status: offer.snapshot.status,
        pointsCost: offer.pointsCost,
        remainingInventory: offer.snapshot.remainingInventory ?? null,
        reserved,
        redeemed,
        expired,
        reversed,
        pointsSpent,
        // Undefined until something has actually settled, rather than a
        // misleading 0% for a campaign that has only just opened.
        collectionRate: settled > 0 ? Number((redeemed / settled).toFixed(3)) : null,
      });
    }

    return {
      institutionId,
      liveOffers: offers.filter((o) => o.snapshot.status === 'live').length,
      totalReserved,
      totalRedeemed,
      totalPointsSpent,
      offers: stats,
    };
  }
}
