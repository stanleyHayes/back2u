import { injectable } from 'inversify';

import type {
  IIdempotencyStore,
  IOtpRepository,
  IPasswordResetRepository,
  IRefreshTokenRepository,
} from '../../../../application/ports/auth-repos.js';
import {
  IdempotencyRecord,
  type IdempotencyRecordSnapshot,
} from '../../../../domain/idempotency/idempotency-key.entity.js';
import { Otp, type OtpSnapshot } from '../../../../domain/auth/otp.entity.js';
import {
  PasswordReset,
  type PasswordResetSnapshot,
} from '../../../../domain/auth/password-reset.entity.js';
import {
  RefreshToken,
  type RefreshTokenSnapshot,
} from '../../../../domain/auth/refresh-token.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  IdempotencyRecordModel,
  OtpModel,
  PasswordResetModel,
  RefreshTokenModel,
} from '../models/auth.model.js';

type RefreshTokenDoc = Omit<RefreshTokenSnapshot, 'id'> & { _id: unknown };
type OtpDoc = Omit<OtpSnapshot, 'id'> & { _id: unknown };
type PasswordResetDoc = Omit<PasswordResetSnapshot, 'id'> & { _id: unknown };
type IdempotencyRecordDoc = Omit<IdempotencyRecordSnapshot, 'id'> & { _id: unknown };

const refreshTokenToSnapshot = (d: RefreshTokenDoc): RefreshTokenSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};
const otpToSnapshot = (d: OtpDoc): OtpSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};
const passwordResetToSnapshot = (d: PasswordResetDoc): PasswordResetSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};
const idempotencyToSnapshot = (d: IdempotencyRecordDoc): IdempotencyRecordSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  async save(t: RefreshToken): Promise<void> {
    const { id, ...rest } = t.snapshot;
    await RefreshTokenModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findByHash(hash: string): Promise<RefreshToken | null> {
    const doc = await RefreshTokenModel.findOne({ tokenHash: hash }).lean<RefreshTokenDoc>();
    return doc ? RefreshToken.rehydrate(refreshTokenToSnapshot(doc)) : null;
  }

  async revokeAllForUser(userId: Id): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
}

@injectable()
export class MongoOtpRepository implements IOtpRepository {
  async save(o: Otp): Promise<void> {
    const { id, ...rest } = o.snapshot;
    await OtpModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findActiveForDestination(
    destination: string,
    channel: 'phone' | 'email',
  ): Promise<Otp | null> {
    const doc = await OtpModel.findOne({
      destination,
      channel,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean<OtpDoc>();
    return doc ? Otp.rehydrate(otpToSnapshot(doc)) : null;
  }

  async findById(id: Id): Promise<Otp | null> {
    const doc = await OtpModel.findById(id).lean<OtpDoc>();
    return doc ? Otp.rehydrate(otpToSnapshot(doc)) : null;
  }
}

@injectable()
export class MongoPasswordResetRepository implements IPasswordResetRepository {
  async save(p: PasswordReset): Promise<void> {
    const { id, ...rest } = p.snapshot;
    await PasswordResetModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findByHash(hash: string): Promise<PasswordReset | null> {
    const doc = await PasswordResetModel.findOne({ tokenHash: hash }).lean<PasswordResetDoc>();
    return doc ? PasswordReset.rehydrate(passwordResetToSnapshot(doc)) : null;
  }
}

@injectable()
export class MongoIdempotencyStore implements IIdempotencyStore {
  async get(keyHash: string, userId?: Id): Promise<IdempotencyRecord | null> {
    const q: Record<string, unknown> = { keyHash, expiresAt: { $gt: new Date() } };
    if (userId) q.userId = userId;
    const doc = await IdempotencyRecordModel.findOne(q).lean<IdempotencyRecordDoc>();
    return doc ? IdempotencyRecord.rehydrate(idempotencyToSnapshot(doc)) : null;
  }

  async put(record: IdempotencyRecord): Promise<void> {
    const { id, ...rest } = record.snapshot;
    await IdempotencyRecordModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }
}
