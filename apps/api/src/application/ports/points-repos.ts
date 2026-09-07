import type { PointAction, PointEntryStatus } from '@back2u/shared-types';

import type { PointLedgerEntry } from '../../domain/points/point-ledger-entry.entity.js';
import type { RiskAssessment } from '../../domain/risk/risk-assessment.entity.js';
import type { BusinessRules } from '../../domain/rules/business-rules.entity.js';
import type { Id } from '../../domain/shared/id.js';

export interface PointsEarnedWindows {
  today: number;
  week: number;
  month: number;
}

export interface IPointLedgerRepository {
  save(entry: PointLedgerEntry): Promise<void>;
  findById(id: Id): Promise<PointLedgerEntry | null>;
  listForUser(
    userId: Id,
    opts: { status?: PointEntryStatus; limit: number; skip: number },
  ): Promise<{ entries: PointLedgerEntry[]; total: number }>;
  /**
   * Work for the clearing pass: pending entries whose hold has elapsed, plus
   * any entry already marked cleared whose balance credit never landed.
   */
  findDue(now: Date, limit: number): Promise<PointLedgerEntry[]>;
  /**
   * Atomically moves one entry from `pending` to `cleared`. Returns false if it
   * was already claimed, which is what stops two concurrent passes — or a pass
   * racing a manual reversal — from crediting the same entry twice.
   */
  claimForClearing(entryId: Id, at: Date): Promise<boolean>;
  /** Records that the balance credit for a claimed entry has landed. */
  markCredited(entryId: Id, at: Date): Promise<void>;
  /** Puts a claimed entry back in the queue after a failed credit. */
  releaseClaim(entryId: Id, pendingUntil: Date): Promise<void>;
  /** All entries attached to one recovery, across both participants. */
  listForCase(caseRef: Id): Promise<PointLedgerEntry[]>;
  /** Sum of credits (pending + cleared) inside each rolling cap window. */
  sumEarnedWindows(userId: Id, now: Date): Promise<PointsEarnedWindows>;
  /** Totals for the user's own points summary. */
  totals(userId: Id): Promise<{ pending: number; lifetimeEarned: number; reversed: number }>;
  /**
   * Recoveries already credited between exactly this pair, either direction.
   * `excludeCaseRef` drops the recovery being priced right now — both sides of
   * one handover are booked in sequence, and counting the first would penalise
   * the second as though it were a repeat.
   */
  countPairRecoveries(userId: Id, counterpartyId: Id, excludeCaseRef?: Id): Promise<number>;
  /**
   * Recoveries this user was credited for *as the finder* against one
   * counterparty. Compared against the reverse direction it reveals the
   * reciprocal farming of spec §6.
   */
  countPairRecoveriesAsFinder(finderId: Id, counterpartyId: Id): Promise<number>;
  /** Entries for a user in the given actions since a cutoff. */
  countByActionSince(userId: Id, actions: PointAction[], since: Date): Promise<number>;
  /** True when this action was already credited for this case and user. */
  existsForCase(userId: Id, caseRef: Id, action: PointAction): Promise<boolean>;
  /**
   * Trust signals for one account (spec §16): how many recoveries it was
   * credited for, how many of those carried independent evidence, how many
   * DISTINCT counterparties it worked with, and how many awards were clawed
   * back. Distinct counterparties rather than raw confirmations is what makes
   * the community component resistant to reciprocal farming.
   */
  trustSignalsFor(userId: Id): Promise<{
    recoveries: number;
    strongEvidenceRecoveries: number;
    distinctCounterparties: number;
    reversals: number;
  }>;
}

export interface IRiskAssessmentRepository {
  save(a: RiskAssessment): Promise<void>;
  findById(id: Id): Promise<RiskAssessment | null>;
  findBySubject(subjectId: Id): Promise<RiskAssessment | null>;
  listOpen(limit: number, skip: number): Promise<{ items: RiskAssessment[]; total: number }>;
  /** Prior confirmed-fraud assessments naming this user in either role. */
  countForUser(userId: Id, since: Date): Promise<number>;
  /**
   * True while an unreviewed high-risk or critical recovery names this user —
   * cash rewards must not be released underneath an open investigation (§14).
   */
  hasOpenBlockingForUser(userId: Id): Promise<boolean>;
}

export interface IBusinessRulesRepository {
  /** Always resolves — seeds the spec defaults on first read. */
  get(): Promise<BusinessRules>;
  save(rules: BusinessRules): Promise<void>;
}
