import type { Id } from '../shared/id.js';

export interface AuditLogSnapshot {
  id: Id;
  actorId?: Id;
  action: string;
  entity: string;
  entityId: Id;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditLog {
  private constructor(private state: AuditLogSnapshot) {}
  static rehydrate(s: AuditLogSnapshot): AuditLog {
    return new AuditLog({ ...s });
  }
  static record(input: Omit<AuditLogSnapshot, 'createdAt'>): AuditLog {
    return new AuditLog({ ...input, createdAt: new Date() });
  }
  get snapshot(): AuditLogSnapshot {
    return { ...this.state };
  }
}
