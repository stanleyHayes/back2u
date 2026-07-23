import mongoose from 'mongoose';

// ── Refresh tokens ──────────────────────────────────────────────────────────

export interface RefreshTokenDoc {
  _id: string;
  userId: string;
  tokenHash: string;
  parentId?: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    tokenHash: { type: String, required: true },
    parentId: { type: String },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    createdAt: { type: Date, required: true },
  },
  { collection: 'refresh_tokens', versionKey: false },
);

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema);

// ── OTPs (phone / email verification) ───────────────────────────────────────

export interface OtpDoc {
  _id: string;
  userId?: string;
  channel: 'phone' | 'email';
  destination: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

const otpSchema = new mongoose.Schema<OtpDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String },
    channel: { type: String, enum: ['phone', 'email'], required: true },
    destination: { type: String, required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
    createdAt: { type: Date, required: true },
  },
  { collection: 'otps', versionKey: false },
);

otpSchema.index({ destination: 1, channel: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = mongoose.model<OtpDoc>('Otp', otpSchema);

// ── Password resets ─────────────────────────────────────────────────────────

export interface PasswordResetDoc {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

const passwordResetSchema = new mongoose.Schema<PasswordResetDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
    createdAt: { type: Date, required: true },
  },
  { collection: 'password_resets', versionKey: false },
);

passwordResetSchema.index({ tokenHash: 1 }, { unique: true });
passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = mongoose.model<PasswordResetDoc>('PasswordReset', passwordResetSchema);

// ── Idempotency keys ────────────────────────────────────────────────────────

export interface IdempotencyRecordDoc {
  _id: string;
  keyHash: string;
  userId?: string;
  method: string;
  path: string;
  status: number;
  responseBody: string;
  createdAt: Date;
  expiresAt: Date;
}

const idempotencyRecordSchema = new mongoose.Schema<IdempotencyRecordDoc>(
  {
    _id: { type: String, required: true },
    keyHash: { type: String, required: true },
    userId: { type: String },
    method: { type: String, required: true },
    path: { type: String, required: true },
    status: { type: Number, required: true },
    responseBody: { type: String, required: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'idempotency_keys', versionKey: false },
);

idempotencyRecordSchema.index({ keyHash: 1, userId: 1 });
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyRecordModel = mongoose.model<IdempotencyRecordDoc>(
  'IdempotencyRecord',
  idempotencyRecordSchema,
);
