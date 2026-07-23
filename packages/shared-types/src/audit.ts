export interface AuditLogDTO {
  id: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}
