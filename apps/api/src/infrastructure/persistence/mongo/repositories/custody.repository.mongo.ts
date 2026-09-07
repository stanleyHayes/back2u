import type { CustodyStatus, RecoveryCaseStatus } from '@back2u/shared-types';
import { injectable } from 'inversify';

import type {
  ICustodyRecordRepository,
  IPartnerLocationRepository,
  IPartnerStaffRepository,
  IRecoveryCaseRepository,
  IRecoveryEventRepository,
} from '../../../../application/ports/custody-repos.js';
import {
  CustodyRecord,
  type CustodyRecordSnapshot,
} from '../../../../domain/custody/custody-record.entity.js';
import {
  PartnerLocation,
  type PartnerLocationSnapshot,
} from '../../../../domain/custody/partner-location.entity.js';
import {
  PartnerStaff,
  type PartnerStaffSnapshot,
} from '../../../../domain/custody/partner-staff.entity.js';
import {
  RecoveryCase,
  type RecoveryCaseSnapshot,
} from '../../../../domain/recovery/recovery-case.entity.js';
import {
  RecoveryEvent,
  type RecoveryEventSnapshot,
} from '../../../../domain/recovery/recovery-event.entity.js';
import { ConflictError } from '../../../../domain/shared/errors.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  CustodyRecordModel,
  PartnerLocationModel,
  PartnerStaffModel,
  RecoveryCaseModel,
  RecoveryEventModel,
  type CustodyRecordDoc,
  type PartnerLocationDoc,
  type PartnerStaffDoc,
  type RecoveryCaseDoc,
  type RecoveryEventDoc,
} from '../models/custody.model.js';

/** Mongo's duplicate-key error, raised when a unique index is violated. */
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;

const locationSnapshot = (d: PartnerLocationDoc): PartnerLocationSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoPartnerLocationRepository implements IPartnerLocationRepository {
  async save(l: PartnerLocation): Promise<void> {
    const { id, ...rest } = l.snapshot;
    await PartnerLocationModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<PartnerLocation | null> {
    const doc = await PartnerLocationModel.findById(id).lean<PartnerLocationDoc | null>();
    return doc ? PartnerLocation.rehydrate(locationSnapshot(doc)) : null;
  }

  async listForInstitution(institutionId: Id): Promise<PartnerLocation[]> {
    const docs = await PartnerLocationModel.find({ institutionId })
      .sort({ createdAt: 1 })
      .lean<PartnerLocationDoc[]>();
    return docs.map((d) => PartnerLocation.rehydrate(locationSnapshot(d)));
  }

  async countForInstitution(institutionId: Id): Promise<number> {
    return PartnerLocationModel.countDocuments({ institutionId, active: true });
  }
}

const staffSnapshot = (d: PartnerStaffDoc): PartnerStaffSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoPartnerStaffRepository implements IPartnerStaffRepository {
  async save(s: PartnerStaff): Promise<void> {
    const { id, ...rest } = s.snapshot;
    try {
      await PartnerStaffModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError('That user is already a staff member of this organisation');
      }
      throw err;
    }
  }

  async findById(id: Id): Promise<PartnerStaff | null> {
    const doc = await PartnerStaffModel.findById(id).lean<PartnerStaffDoc | null>();
    return doc ? PartnerStaff.rehydrate(staffSnapshot(doc)) : null;
  }

  async findMembership(userId: Id, institutionId: Id): Promise<PartnerStaff | null> {
    const doc = await PartnerStaffModel.findOne({
      userId,
      institutionId,
    }).lean<PartnerStaffDoc | null>();
    return doc ? PartnerStaff.rehydrate(staffSnapshot(doc)) : null;
  }

  async listForUser(userId: Id): Promise<PartnerStaff[]> {
    const docs = await PartnerStaffModel.find({ userId, active: true }).lean<PartnerStaffDoc[]>();
    return docs.map((d) => PartnerStaff.rehydrate(staffSnapshot(d)));
  }

  async listForInstitution(institutionId: Id): Promise<PartnerStaff[]> {
    const docs = await PartnerStaffModel.find({ institutionId })
      .sort({ createdAt: 1 })
      .lean<PartnerStaffDoc[]>();
    return docs.map((d) => PartnerStaff.rehydrate(staffSnapshot(d)));
  }

  async countForInstitution(institutionId: Id): Promise<number> {
    return PartnerStaffModel.countDocuments({ institutionId, active: true });
  }
}

const custodySnapshot = (d: CustodyRecordDoc): CustodyRecordSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoCustodyRecordRepository implements ICustodyRecordRepository {
  async save(r: CustodyRecord): Promise<void> {
    const { id, ...rest } = r.snapshot;
    await CustodyRecordModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<CustodyRecord | null> {
    const doc = await CustodyRecordModel.findById(id).lean<CustodyRecordDoc | null>();
    return doc ? CustodyRecord.rehydrate(custodySnapshot(doc)) : null;
  }

  async findActiveForItem(itemId: Id): Promise<CustodyRecord | null> {
    const doc = await CustodyRecordModel.findOne({
      itemId,
      status: 'held',
    }).lean<CustodyRecordDoc | null>();
    return doc ? CustodyRecord.rehydrate(custodySnapshot(doc)) : null;
  }

  async listForItem(itemId: Id): Promise<CustodyRecord[]> {
    const docs = await CustodyRecordModel.find({ itemId })
      .sort({ createdAt: 1 })
      .lean<CustodyRecordDoc[]>();
    return docs.map((d) => CustodyRecord.rehydrate(custodySnapshot(d)));
  }

  async findByCaseId(caseId: Id): Promise<CustodyRecord | null> {
    const doc = await CustodyRecordModel.findOne({ caseId })
      .sort({ createdAt: -1 })
      .lean<CustodyRecordDoc | null>();
    return doc ? CustodyRecord.rehydrate(custodySnapshot(doc)) : null;
  }

  async listForLocation(
    locationId: Id,
    opts: { status?: CustodyStatus; limit: number; skip: number },
  ): Promise<{ records: CustodyRecord[]; total: number }> {
    const filter: Record<string, unknown> = { locationId };
    if (opts.status) filter.status = opts.status;
    const [docs, total] = await Promise.all([
      CustodyRecordModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .lean<CustodyRecordDoc[]>(),
      CustodyRecordModel.countDocuments(filter),
    ]);
    return { records: docs.map((d) => CustodyRecord.rehydrate(custodySnapshot(d))), total };
  }

  async countForInstitution(
    institutionId: Id,
  ): Promise<{ deposits: number; releases: number; open: number }> {
    const rows = await CustodyRecordModel.aggregate<{ _id: CustodyStatus; count: number }>([
      { $match: { institutionId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const by = new Map(rows.map((r) => [r._id, r.count]));
    const deposits = rows.reduce((sum, r) => sum + r.count, 0);
    return { deposits, releases: by.get('released') ?? 0, open: by.get('held') ?? 0 };
  }

  async countDepositsByInstitutionForUser(userId: Id, since: Date): Promise<Record<Id, number>> {
    const rows = await CustodyRecordModel.aggregate<{ _id: Id; count: number }>([
      { $match: { depositedByUserId: userId, createdAt: { $gte: since } } },
      { $group: { _id: '$institutionId', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  }
}

const caseSnapshot = (d: RecoveryCaseDoc): RecoveryCaseSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoRecoveryCaseRepository implements IRecoveryCaseRepository {
  async save(c: RecoveryCase): Promise<void> {
    const { id, ...rest } = c.snapshot;
    try {
      await RecoveryCaseModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError('A recovery case already exists for this item');
      }
      throw err;
    }
  }

  async findById(id: Id): Promise<RecoveryCase | null> {
    const doc = await RecoveryCaseModel.findById(id).lean<RecoveryCaseDoc | null>();
    return doc ? RecoveryCase.rehydrate(caseSnapshot(doc)) : null;
  }

  async findByReference(reference: string): Promise<RecoveryCase | null> {
    const doc = await RecoveryCaseModel.findOne({ reference }).lean<RecoveryCaseDoc | null>();
    return doc ? RecoveryCase.rehydrate(caseSnapshot(doc)) : null;
  }

  async findByFoundItemId(itemId: Id): Promise<RecoveryCase | null> {
    const doc = await RecoveryCaseModel.findOne({
      foundItemId: itemId,
    }).lean<RecoveryCaseDoc | null>();
    return doc ? RecoveryCase.rehydrate(caseSnapshot(doc)) : null;
  }

  async findByMatchId(matchId: Id): Promise<RecoveryCase | null> {
    const doc = await RecoveryCaseModel.findOne({ matchId }).lean<RecoveryCaseDoc | null>();
    return doc ? RecoveryCase.rehydrate(caseSnapshot(doc)) : null;
  }

  async listForInstitution(
    institutionId: Id,
    opts: { status?: RecoveryCaseStatus; limit: number; skip: number },
  ): Promise<{ cases: RecoveryCase[]; total: number }> {
    const filter: Record<string, unknown> = { institutionId };
    if (opts.status) filter.status = opts.status;
    const [docs, total] = await Promise.all([
      RecoveryCaseModel.find(filter)
        .sort({ openedAt: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .lean<RecoveryCaseDoc[]>(),
      RecoveryCaseModel.countDocuments(filter),
    ]);
    return { cases: docs.map((d) => RecoveryCase.rehydrate(caseSnapshot(d))), total };
  }

  async listForUser(userId: Id, limit: number): Promise<RecoveryCase[]> {
    const docs = await RecoveryCaseModel.find({
      $or: [{ finderId: userId }, { claimantId: userId }],
    })
      .sort({ openedAt: -1 })
      .limit(limit)
      .lean<RecoveryCaseDoc[]>();
    return docs.map((d) => RecoveryCase.rehydrate(caseSnapshot(d)));
  }
}

const eventSnapshot = (d: RecoveryEventDoc): RecoveryEventSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoRecoveryEventRepository implements IRecoveryEventRepository {
  /**
   * Insert-only by design. Every other repository here upserts, which would let
   * a repeated id silently rewrite a custody event — exactly what spec §12
   * forbids. The unique (caseId, sequence) index turns a concurrent double-write
   * into a conflict instead of a lost link in the chain.
   */
  async append(e: RecoveryEvent): Promise<void> {
    const { id, ...rest } = e.snapshot;
    try {
      await RecoveryEventModel.create({ _id: id, ...rest });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError('A custody event with that position already exists');
      }
      throw err;
    }
  }

  async listForCase(caseId: Id): Promise<RecoveryEvent[]> {
    const docs = await RecoveryEventModel.find({ caseId })
      .sort({ sequence: 1 })
      .lean<RecoveryEventDoc[]>();
    return docs.map((d) => RecoveryEvent.rehydrate(eventSnapshot(d)));
  }

  async findById(id: Id): Promise<RecoveryEvent | null> {
    const doc = await RecoveryEventModel.findById(id).lean<RecoveryEventDoc | null>();
    return doc ? RecoveryEvent.rehydrate(eventSnapshot(doc)) : null;
  }
}
