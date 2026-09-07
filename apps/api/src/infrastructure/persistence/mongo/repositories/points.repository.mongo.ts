import type { PointAction, PointEntryStatus } from '@back2u/shared-types';
import { injectable } from 'inversify';

import type {
  IBusinessRulesRepository,
  IPointLedgerRepository,
  IRiskAssessmentRepository,
  PointsEarnedWindows,
} from '../../../../application/ports/points-repos.js';
import {
  PointLedgerEntry,
  type PointLedgerEntrySnapshot,
} from '../../../../domain/points/point-ledger-entry.entity.js';
import {
  RiskAssessment,
  type RiskAssessmentSnapshot,
} from '../../../../domain/risk/risk-assessment.entity.js';
import {
  BUSINESS_RULES_ID,
  BusinessRules,
  type BusinessRulesSnapshot,
} from '../../../../domain/rules/business-rules.entity.js';
import { DuplicateError } from '../../../../domain/shared/errors.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  BusinessRulesModel,
  PointLedgerEntryModel,
  RiskAssessmentModel,
  type BusinessRulesDoc,
  type PointLedgerEntryDoc,
  type RiskAssessmentDoc,
} from '../models/points.model.js';

const MS_PER_DAY = 86_400_000;

/** Actions that count as "a recovery" for pairing and frequency rules. */
const RECOVERY_ACTIONS: PointAction[] = [
  'recovery_ordinary',
  'recovery_document',
  'recovery_device',
];

/** Statuses whose points count toward the rolling earning caps. */
const COUNTED_STATUSES: PointEntryStatus[] = ['pending', 'cleared'];

/** Verification levels that carry evidence beyond the two parties' say-so. */
const STRONG_EVIDENCE_LEVELS = ['recovery_point', 'verified_delivery', 'institutional'];

const toEntrySnapshot = (d: PointLedgerEntryDoc): PointLedgerEntrySnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

/** Mongo's duplicate-key error, raised when a unique index is violated. */
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;

@injectable()
export class MongoPointLedgerRepository implements IPointLedgerRepository {
  async save(entry: PointLedgerEntry): Promise<void> {
    const { id, ...rest } = entry.snapshot;
    try {
      await PointLedgerEntryModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
    } catch (err) {
      // The partial unique (userId, caseRef, action) index fired: this award was
      // already booked. Surfaced as a domain error so callers need not know
      // anything about Mongo.
      if (isDuplicateKeyError(err)) throw new DuplicateError('An award for this recovery');
      throw err;
    }
  }

  async findById(id: Id): Promise<PointLedgerEntry | null> {
    const doc = await PointLedgerEntryModel.findById(id).lean<PointLedgerEntryDoc | null>();
    return doc ? PointLedgerEntry.rehydrate(toEntrySnapshot(doc)) : null;
  }

  async listForUser(
    userId: Id,
    opts: { status?: PointEntryStatus; limit: number; skip: number },
  ): Promise<{ entries: PointLedgerEntry[]; total: number }> {
    const filter: Record<string, unknown> = { userId };
    if (opts.status) filter.status = opts.status;
    const [docs, total] = await Promise.all([
      PointLedgerEntryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .lean<PointLedgerEntryDoc[]>(),
      PointLedgerEntryModel.countDocuments(filter),
    ]);
    return { entries: docs.map((d) => PointLedgerEntry.rehydrate(toEntrySnapshot(d))), total };
  }

  async findDue(now: Date, limit: number): Promise<PointLedgerEntry[]> {
    const docs = await PointLedgerEntryModel.find({
      $or: [
        { status: 'pending', pendingUntil: { $lte: now } },
        // Repair path: a previous pass claimed the entry but died before the
        // balance credit landed. Without this the points would be stranded as
        // "cleared" forever with nothing to pick them up.
        { status: 'cleared', creditedAt: { $exists: false } },
      ],
    })
      .sort({ pendingUntil: 1 })
      .limit(limit)
      .lean<PointLedgerEntryDoc[]>();
    return docs.map((d) => PointLedgerEntry.rehydrate(toEntrySnapshot(d)));
  }

  async claimForClearing(entryId: Id, at: Date): Promise<boolean> {
    // Conditional on `pending`, so only one caller can ever win the claim.
    const res = await PointLedgerEntryModel.updateOne(
      { _id: entryId, status: 'pending' },
      { $set: { status: 'cleared', clearedAt: at, updatedAt: at } },
    );
    return res.modifiedCount === 1;
  }

  async markCredited(entryId: Id, at: Date): Promise<void> {
    await PointLedgerEntryModel.updateOne(
      { _id: entryId },
      { $set: { creditedAt: at, updatedAt: at } },
    );
  }

  async releaseClaim(entryId: Id, pendingUntil: Date): Promise<void> {
    await PointLedgerEntryModel.updateOne(
      { _id: entryId, status: 'cleared', creditedAt: { $exists: false } },
      {
        $set: { status: 'pending', pendingUntil, updatedAt: new Date() },
        $unset: { clearedAt: '' },
      },
    );
  }

  async listForCase(caseRef: Id): Promise<PointLedgerEntry[]> {
    const docs = await PointLedgerEntryModel.find({ caseRef }).lean<PointLedgerEntryDoc[]>();
    return docs.map((d) => PointLedgerEntry.rehydrate(toEntrySnapshot(d)));
  }

  async sumEarnedWindows(userId: Id, now: Date): Promise<PointsEarnedWindows> {
    const dayAgo = new Date(now.getTime() - MS_PER_DAY);
    const weekAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
    const monthAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

    // One pass over the month window; the shorter windows are subsets of it.
    const rows = await PointLedgerEntryModel.aggregate<{
      _id: null;
      today: number;
      week: number;
      month: number;
    }>([
      {
        $match: {
          userId,
          status: { $in: COUNTED_STATUSES },
          points: { $gt: 0 },
          createdAt: { $gte: monthAgo },
        },
      },
      {
        $group: {
          _id: null,
          today: {
            $sum: { $cond: [{ $gte: ['$createdAt', dayAgo] }, '$points', 0] },
          },
          week: {
            $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, '$points', 0] },
          },
          month: { $sum: '$points' },
        },
      },
    ]);
    const row = rows[0];
    return { today: row?.today ?? 0, week: row?.week ?? 0, month: row?.month ?? 0 };
  }

  async totals(userId: Id): Promise<{ pending: number; lifetimeEarned: number; reversed: number }> {
    const rows = await PointLedgerEntryModel.aggregate<{ _id: PointEntryStatus; sum: number }>([
      { $match: { userId, points: { $gt: 0 } } },
      { $group: { _id: '$status', sum: { $sum: '$points' } } },
    ]);
    const by = new Map(rows.map((r) => [r._id, r.sum]));
    return {
      pending: by.get('pending') ?? 0,
      lifetimeEarned: by.get('cleared') ?? 0,
      reversed: by.get('reversed') ?? 0,
    };
  }

  async countPairRecoveries(userId: Id, counterpartyId: Id, excludeCaseRef?: Id): Promise<number> {
    return PointLedgerEntryModel.countDocuments({
      // Either direction: this user credited against the counterparty, or vice versa.
      $or: [
        { userId, counterpartyId },
        { userId: counterpartyId, counterpartyId: userId },
      ],
      action: { $in: RECOVERY_ACTIONS },
      status: { $in: COUNTED_STATUSES },
      ...(excludeCaseRef ? { caseRef: { $ne: excludeCaseRef } } : {}),
    });
  }

  async countPairRecoveriesAsFinder(finderId: Id, counterpartyId: Id): Promise<number> {
    return PointLedgerEntryModel.countDocuments({
      userId: finderId,
      counterpartyId,
      action: { $in: RECOVERY_ACTIONS },
      status: { $in: COUNTED_STATUSES },
    });
  }

  async countByActionSince(userId: Id, actions: PointAction[], since: Date): Promise<number> {
    return PointLedgerEntryModel.countDocuments({
      userId,
      action: { $in: actions },
      status: { $in: COUNTED_STATUSES },
      createdAt: { $gte: since },
    });
  }

  async trustSignalsFor(userId: Id): Promise<{
    recoveries: number;
    strongEvidenceRecoveries: number;
    distinctCounterparties: number;
    reversals: number;
  }> {
    const rows = await PointLedgerEntryModel.aggregate<{
      _id: null;
      recoveries: number;
      strongEvidenceRecoveries: number;
      counterparties: Id[];
      reversals: number;
    }>([
      { $match: { userId, action: { $in: RECOVERY_ACTIONS } } },
      {
        $group: {
          _id: null,
          recoveries: {
            $sum: { $cond: [{ $in: ['$status', COUNTED_STATUSES] }, 1, 0] },
          },
          strongEvidenceRecoveries: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', COUNTED_STATUSES] },
                    { $in: ['$verificationLevel', STRONG_EVIDENCE_LEVELS] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          counterparties: { $addToSet: '$counterpartyId' },
          reversals: { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] } },
        },
      },
    ]);
    const row = rows[0];
    return {
      recoveries: row?.recoveries ?? 0,
      strongEvidenceRecoveries: row?.strongEvidenceRecoveries ?? 0,
      // `$addToSet` keeps nulls for entries with no counterparty; drop them.
      distinctCounterparties: (row?.counterparties ?? []).filter(Boolean).length,
      reversals: row?.reversals ?? 0,
    };
  }

  async existsForCase(userId: Id, caseRef: Id, action: PointAction): Promise<boolean> {
    const count = await PointLedgerEntryModel.countDocuments({
      userId,
      caseRef,
      action,
      status: { $ne: 'cancelled' },
    });
    return count > 0;
  }
}

const toAssessmentSnapshot = (d: RiskAssessmentDoc): RiskAssessmentSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoRiskAssessmentRepository implements IRiskAssessmentRepository {
  async save(a: RiskAssessment): Promise<void> {
    const { id, ...rest } = a.snapshot;
    await RiskAssessmentModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<RiskAssessment | null> {
    const doc = await RiskAssessmentModel.findById(id).lean<RiskAssessmentDoc | null>();
    return doc ? RiskAssessment.rehydrate(toAssessmentSnapshot(doc)) : null;
  }

  async findBySubject(subjectId: Id): Promise<RiskAssessment | null> {
    const doc = await RiskAssessmentModel.findOne({ subjectId }).lean<RiskAssessmentDoc | null>();
    return doc ? RiskAssessment.rehydrate(toAssessmentSnapshot(doc)) : null;
  }

  async listOpen(limit: number, skip: number): Promise<{ items: RiskAssessment[]; total: number }> {
    const filter = { reviewStatus: 'open' } as const;
    const [docs, total] = await Promise.all([
      RiskAssessmentModel.find(filter)
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<RiskAssessmentDoc[]>(),
      RiskAssessmentModel.countDocuments(filter),
    ]);
    return { items: docs.map((d) => RiskAssessment.rehydrate(toAssessmentSnapshot(d))), total };
  }

  async countForUser(userId: Id, since: Date): Promise<number> {
    return RiskAssessmentModel.countDocuments({
      $or: [{ ownerId: userId }, { finderId: userId }],
      reviewStatus: 'confirmed_fraud',
      createdAt: { $gte: since },
    });
  }

  async hasOpenBlockingForUser(userId: Id): Promise<boolean> {
    const count = await RiskAssessmentModel.countDocuments({
      $or: [{ ownerId: userId }, { finderId: userId }],
      reviewStatus: 'open',
      action: { $in: ['manual_review', 'freeze'] },
    });
    return count > 0;
  }
}

@injectable()
export class MongoBusinessRulesRepository implements IBusinessRulesRepository {
  async get(): Promise<BusinessRules> {
    const doc = await BusinessRulesModel.findById(
      BUSINESS_RULES_ID,
    ).lean<BusinessRulesDoc | null>();
    if (!doc) {
      // First read seeds the spec defaults so the economy is always resolvable.
      const rules = BusinessRules.createDefault();
      await this.save(rules);
      return rules;
    }
    const { _id, ...rest } = doc;
    return BusinessRules.rehydrate({ ...(rest as Omit<BusinessRulesSnapshot, 'id'>), id: _id });
  }

  async save(rules: BusinessRules): Promise<void> {
    const { id, ...rest } = rules.snapshot;
    await BusinessRulesModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }
}
