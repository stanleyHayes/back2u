import mongoose from 'mongoose';

export interface AuditLogDoc {
  _id: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLogDoc>(
  {
    _id: { type: String, required: true },
    actorId: { type: String },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, required: true },
  },
  { collection: 'audit_logs', versionKey: false },
);

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<AuditLogDoc>('AuditLog', auditLogSchema);
