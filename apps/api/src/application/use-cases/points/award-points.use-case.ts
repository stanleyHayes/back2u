import type { PointAction, VerificationLevel } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import {
  PointLedgerEntry,
  toPointLedgerEntryDTO,
} from '../../../domain/points/point-ledger-entry.entity.js';
import { computeAward } from '../../../domain/points/points-policy.js';
import { DuplicateError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IBusinessRulesRepository, IPointLedgerRepository } from '../../ports/points-repos.js';
import type { IUserRepository } from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const MS_PER_DAY = 86_400_000;

export interface AwardPointsCommand {
  userId: Id;
  action: PointAction;
  verificationLevel?: VerificationLevel;
  category?: string;
  /** The recovery this award belongs to. Makes the award idempotent. */
  caseRef?: Id;
  itemId?: Id;
  /** The other party on the recovery, for repeat-pair detection. */
  counterpartyId?: Id;
  /** Extra holding days demanded by the risk engine. */
  extraHoldDays?: number;
}

/**
 * The single entry point for crediting BakPoints.
 *
 * Points never touch the user's balance here: the entry is written `pending` and
 * only `ClearPendingPointsUseCase` moves it into the balance once the holding
 * period of spec §4 has elapsed. That is what makes a reward reversible while a
 * fraud review, dispute or chargeback is still possible.
 */
@injectable()
export class AwardPointsUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.BusinessRulesRepository) private readonly rulesRepo: IBusinessRulesRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(cmd: AwardPointsCommand): Promise<PointLedgerEntry | null> {
    // Crediting the same action twice for one recovery is the cheapest possible
    // farm, so a repeated award for a case is dropped rather than stacked.
    if (cmd.caseRef && (await this.ledger.existsForCase(cmd.userId, cmd.caseRef, cmd.action))) {
      this.logger.info('points award skipped — already credited', {
        userId: cmd.userId,
        caseRef: cmd.caseRef,
        action: cmd.action,
      });
      return null;
    }

    const user = await this.users.findById(cmd.userId);
    if (!user) throw new NotFoundError('User');

    const rules = await this.rulesRepo.get();
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

    const [windows, priorPairCount, recoveriesLast30d] = await Promise.all([
      this.ledger.sumEarnedWindows(cmd.userId, now),
      cmd.counterpartyId
        ? this.ledger.countPairRecoveries(cmd.userId, cmd.counterpartyId, cmd.caseRef)
        : Promise.resolve(0),
      this.ledger.countByActionSince(
        cmd.userId,
        ['recovery_ordinary', 'recovery_document', 'recovery_device'],
        monthAgo,
      ),
    ]);

    const computation = computeAward(
      {
        action: cmd.action,
        verificationLevel: cmd.verificationLevel,
        category: cmd.category,
        priorPairCount,
        recoveriesLast30d,
        accountAgeDays: (now.getTime() - user.snapshot.createdAt.getTime()) / MS_PER_DAY,
        earnedToday: windows.today,
        earnedThisWeek: windows.week,
        earnedThisMonth: windows.month,
        extraHoldDays: cmd.extraHoldDays,
        now,
      },
      rules,
    );

    const entry = PointLedgerEntry.pending({
      id: newId(),
      userId: cmd.userId,
      action: cmd.action,
      points: computation.points,
      basePoints: computation.basePoints,
      multiplier: computation.multiplier,
      pendingUntil: computation.pendingUntil,
      verificationLevel: cmd.verificationLevel,
      caseRef: cmd.caseRef,
      itemId: cmd.itemId,
      counterpartyId: cmd.counterpartyId,
      reasons: computation.reasons,
    });
    try {
      await this.ledger.save(entry);
    } catch (err) {
      // Lost the race against a concurrent confirmation of the same recovery.
      // The unique (userId, caseRef, action) index is what makes the earlier
      // `existsForCase` check sound, and losing here means the work is already
      // credited — not that anything failed.
      if (cmd.caseRef && err instanceof DuplicateError) {
        this.logger.info('points award skipped — credited concurrently', {
          userId: cmd.userId,
          caseRef: cmd.caseRef,
          action: cmd.action,
        });
        return null;
      }
      throw err;
    }

    this.logger.info('points awarded (pending)', { ...toPointLedgerEntryDTO(entry) });
    return entry;
  }
}
