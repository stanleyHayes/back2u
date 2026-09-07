import type {
  AdjustPointsInput,
  PointEntryStatus,
  PointLedgerEntryDTO,
  PointsSummaryDTO,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import {
  PointLedgerEntry,
  toPointLedgerEntryDTO,
} from '../../../domain/points/point-ledger-entry.entity.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IBusinessRulesRepository,
  IPointLedgerRepository,
  IRiskAssessmentRepository,
} from '../../ports/points-repos.js';
import type {
  IAuditLogRepository,
  INotificationRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { ILogger, IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

/** How many due entries one clearing pass will settle. */
const CLEAR_BATCH_SIZE = 500;
/** How long a failed credit waits before the next pass retries it. */
const RETRY_BACKOFF_MS = 5 * 60_000;

@injectable()
export class GetPointsSummaryUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
  ) {}

  async execute(userId: Id): Promise<PointsSummaryDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    const [totals, windows] = await Promise.all([
      this.ledger.totals(userId),
      this.ledger.sumEarnedWindows(userId, new Date()),
    ]);
    return {
      balance: user.snapshot.pointsBalance,
      pending: totals.pending,
      lifetimeEarned: totals.lifetimeEarned,
      reversed: totals.reversed,
      earnedToday: windows.today,
      earnedThisWeek: windows.week,
      earnedThisMonth: windows.month,
    };
  }
}

@injectable()
export class ListMyPointLedgerUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
  ) {}

  async execute(
    userId: Id,
    opts: { status?: PointEntryStatus; limit: number; skip: number },
  ): Promise<{ entries: PointLedgerEntryDTO[]; total: number }> {
    const { entries, total } = await this.ledger.listForUser(userId, opts);
    return { entries: entries.map(toPointLedgerEntryDTO), total };
  }
}

/**
 * Moves due pending entries into the user's spendable balance.
 *
 * Runs on a schedule rather than a timer per entry, and re-checks the recovery's
 * risk assessment at clearing time: a case escalated to manual review or frozen
 * after the award was made must not clear on the original timetable (§6).
 */
@injectable()
export class ClearPendingPointsUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
    @inject(TOKENS.BusinessRulesRepository) private readonly rulesRepo: IBusinessRulesRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(now = new Date()): Promise<{ cleared: number; held: number }> {
    const due = await this.ledger.findDue(now, CLEAR_BATCH_SIZE);
    if (due.length === 0) return { cleared: 0, held: 0 };

    const rules = await this.rulesRepo.get();
    const holdMs = rules.snapshot.riskExtendedPendingDays * 86_400_000;
    let cleared = 0;
    let held = 0;

    // Cache assessments — both sides of one recovery share a case.
    const assessments = new Map<Id, boolean>();

    for (const entry of due) {
      const s = entry.snapshot;
      try {
        if (s.caseRef) {
          let blocked = assessments.get(s.caseRef);
          if (blocked === undefined) {
            const assessment = await this.risks.findBySubject(s.caseRef);
            blocked = assessment?.blocksRewards ?? false;
            assessments.set(s.caseRef, blocked);
          }
          if (blocked) {
            entry.extendHold(new Date(now.getTime() + holdMs));
            await this.ledger.save(entry);
            held += 1;
            continue;
          }
        }

        // Claim the entry atomically. Losing the claim means another pass (or a
        // reversal) already took it, and crediting again would double-pay.
        if (!entry.isCredited && entry.status === 'pending') {
          const won = await this.ledger.claimForClearing(s.id, now);
          if (!won) continue;
        }
        cleared += 1;

        if (s.points === 0) {
          await this.ledger.markCredited(s.id, now);
          continue;
        }

        try {
          // `$inc` rather than a whole-document write: the clearing job runs
          // concurrently with ordinary profile and points activity, and a
          // read-modify-write here would silently revert those.
          await this.users.incrementPoints(s.userId, s.points);
          await this.ledger.markCredited(s.id, now);
        } catch (err) {
          // Put it back in the queue rather than leaving points stranded in a
          // cleared-but-uncredited limbo.
          await this.ledger
            .releaseClaim(s.id, new Date(now.getTime() + RETRY_BACKOFF_MS))
            .catch(() => {});
          cleared -= 1;
          throw err;
        }

        const title = 'BakPoints cleared';
        const body = `${s.points} BakPoints are now available to spend.`;
        const data = { entryId: s.id, points: s.points, action: s.action };
        await this.notifications.save(
          Notification.create({ id: newId(), userId: s.userId, type: 'system', title, body, data }),
        );
        this.bus.publishToUser(s.userId, 'points:cleared', data);
      } catch (err) {
        this.logger.error('points clearing failed', {
          entryId: s.id,
          error: (err as Error).message,
        });
      }
    }

    this.logger.info('points.clear-pending', { due: due.length, cleared, held });
    return { cleared, held };
  }
}

/**
 * Claws points back after confirmed fraud or a lost dispute (§7: "permit reward
 * reversals"). A cleared entry is deducted from the balance; a pending one never
 * reached it, so reversing it only closes the entry out.
 */
@injectable()
export class ReversePointsUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}

  async execute(entryId: Id, actorId: Id, note: string): Promise<PointLedgerEntryDTO> {
    const entry = await this.ledger.findById(entryId);
    if (!entry) throw new NotFoundError('Ledger entry');

    // Deduct before recording the reversal: if the deduction fails the entry is
    // untouched and the whole operation can simply be retried. The other order
    // would leave a reversed entry whose points were never taken back.
    const wasCredited = entry.isCredited;
    if (wasCredited && entry.points !== 0) {
      // A reversal may legitimately push the balance negative; spending is
      // guarded separately, and forgiving the debt would reward the fraud.
      await this.users.incrementPoints(entry.userId, -entry.points);
      this.bus.publishToUser(entry.userId, 'points:reversed', { entryId, points: entry.points });
    }

    entry.reverse(note);
    await this.ledger.save(entry);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'points.reverse',
        entity: 'point_ledger_entry',
        entityId: entryId,
        meta: { userId: entry.userId, points: entry.points, wasCredited, note },
      }),
    );

    return toPointLedgerEntryDTO(entry);
  }
}

/** Reverses every entry attached to one recovery — used on confirmed fraud. */
@injectable()
export class ReverseCasePointsUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(caseRef: Id, note: string): Promise<number> {
    const entries = await this.ledger.listForCase(caseRef);
    let reversed = 0;
    for (const entry of entries) {
      if (entry.status === 'reversed' || entry.status === 'cancelled') continue;
      const wasCredited = entry.isCredited;
      try {
        if (wasCredited && entry.points !== 0) {
          await this.users.incrementPoints(entry.userId, -entry.points);
        }
        entry.reverse(note);
        await this.ledger.save(entry);
        reversed += 1;
      } catch (err) {
        this.logger.error('case points reversal failed', {
          entryId: entry.id,
          error: (err as Error).message,
        });
      }
    }
    return reversed;
  }
}

/**
 * An explicit admin credit or debit. Settles immediately — an adjustment is a
 * deliberate human decision, so there is nothing for the holding period to guard.
 */
@injectable()
export class AdjustPointsUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(input: AdjustPointsInput, actorId: Id): Promise<PointLedgerEntryDTO> {
    if (!Number.isInteger(input.points) || input.points === 0) {
      throw new ValidationError('Points must be a non-zero integer');
    }
    if (!input.note.trim()) throw new ValidationError('An adjustment needs a note');

    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');

    const entry = PointLedgerEntry.settled({
      id: newId(),
      userId: input.userId,
      action: 'admin_adjustment',
      points: input.points,
      resolutionNote: input.note,
      reasons: [{ code: 'base', detail: input.note }],
    });

    await this.users.incrementPoints(input.userId, input.points);
    await this.ledger.save(entry);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'points.adjust',
        entity: 'user',
        entityId: input.userId,
        meta: { points: input.points, note: input.note, entryId: entry.id },
      }),
    );

    return toPointLedgerEntryDTO(entry);
  }
}

/** Records a confirmed-fraud penalty and freezes the account. (§3, §7) */
@injectable()
export class ApplyFraudPenaltyUseCase {
  constructor(
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.BusinessRulesRepository) private readonly rulesRepo: IBusinessRulesRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(userId: Id, actorId: Id, note: string, caseRef?: Id): Promise<PointLedgerEntryDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (user.snapshot.status === 'banned') throw new ConflictError('User is already banned');

    const rules = await this.rulesRepo.get();
    const penalty = rules.snapshot.pointsPerAction.fraud_penalty;

    const entry = PointLedgerEntry.settled({
      id: newId(),
      userId,
      action: 'fraud_penalty',
      points: -penalty,
      caseRef,
      resolutionNote: note,
      reasons: [{ code: 'base', detail: `Confirmed fraudulent recovery: ${note}` }],
    });

    user.updateStatus('suspended');
    await this.users.save(user);
    await this.users.incrementPoints(userId, -penalty);
    await this.ledger.save(entry);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'points.fraudPenalty',
        entity: 'user',
        entityId: userId,
        meta: { penalty, note, caseRef, entryId: entry.id },
      }),
    );

    return toPointLedgerEntryDTO(entry);
  }
}
