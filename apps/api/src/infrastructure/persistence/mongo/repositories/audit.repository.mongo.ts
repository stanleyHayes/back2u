import { injectable } from 'inversify';

import type { IAuditLogRepository } from '../../../../application/ports/repositories.js';
import { AuditLog, type AuditLogSnapshot } from '../../../../domain/audit/audit-log.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { AuditLogModel } from '../models/audit.model.js';

type AuditLogDoc = Omit<AuditLogSnapshot, 'id'> & { _id: unknown };

const toSnapshot = (d: AuditLogDoc): AuditLogSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoAuditLogRepository implements IAuditLogRepository {
  async save(log: AuditLog): Promise<void> {
    const { id, ...rest } = log.snapshot;
    await AuditLogModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async list(filter: {
    entity?: string;
    entityId?: Id;
    actorId?: Id;
    limit: number;
  }): Promise<AuditLog[]> {
    const q: Record<string, unknown> = {};
    if (filter.entity) q.entity = filter.entity;
    if (filter.entityId) q.entityId = filter.entityId;
    if (filter.actorId) q.actorId = filter.actorId;
    const docs = await AuditLogModel.find(q)
      .sort({ createdAt: -1 })
      .limit(filter.limit)
      .lean<AuditLogDoc[]>();
    return docs.map((d) => AuditLog.rehydrate(toSnapshot(d)));
  }
}
