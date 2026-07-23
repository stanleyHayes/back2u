import { inject, injectable } from 'inversify';

import type { AuditLogDTO } from '@back2u/shared-types';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IAuditLogRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(log: AuditLog): AuditLogDTO {
  const s = log.snapshot;
  return {
    id: s.id,
    actorId: s.actorId,
    action: s.action,
    entity: s.entity,
    entityId: s.entityId,
    meta: s.meta,
    ip: s.ip,
    userAgent: s.userAgent,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class WriteAuditLogUseCase {
  constructor(@inject(TOKENS.AuditLogRepository) private readonly repo: IAuditLogRepository) {}

  async execute(input: {
    actorId?: Id;
    action: string;
    entity: string;
    entityId: Id;
    meta?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.repo.save(AuditLog.record({ id: newId(), ...input }));
  }
}

@injectable()
export class ListAuditLogsUseCase {
  constructor(@inject(TOKENS.AuditLogRepository) private readonly repo: IAuditLogRepository) {}

  async execute(filter: {
    entity?: string;
    entityId?: Id;
    actorId?: Id;
    limit?: number;
  }): Promise<AuditLogDTO[]> {
    const list = await this.repo.list({
      entity: filter.entity,
      entityId: filter.entityId,
      actorId: filter.actorId,
      limit: filter.limit ?? 100,
    });
    return list.map(toDTO);
  }
}
