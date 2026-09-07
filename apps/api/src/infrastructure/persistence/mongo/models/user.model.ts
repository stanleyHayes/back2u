import mongoose from 'mongoose';

import type { EmailPreferences } from '@back2u/shared-types';

import type { UserSnapshot } from '../../../../domain/user/user.entity.js';

/**
 * Derived from the entity snapshot rather than hand-listed. A duplicated
 * interface silently loses any field added to the entity but forgotten here,
 * which is exactly how a partner `tier` once stopped persisting.
 */
export type UserDoc = Omit<UserSnapshot, 'id'> & { _id: string };

const emailPreferencesSchema = new mongoose.Schema<EmailPreferences>(
  {
    marketing: { type: Boolean, default: true },
    matches: { type: Boolean, default: true },
    chat: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
    courier: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    avatarUrl: { type: String },
    momoProvider: { type: String, enum: ['MTN', 'VOD', 'ATL'] },
    momoNumber: { type: String },
    roles: {
      type: [String],
      enum: [
        'user',
        'finder',
        'trusted_finder',
        'courier',
        'partner_admin',
        'admin',
        'super_admin',
      ],
      default: ['user'],
    },
    status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active' },
    reputationScore: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0, index: true },
    trustLevel: {
      type: String,
      enum: ['new_finder', 'helper', 'trusted_finder', 'community_hero', 'guardian', 'legend'],
      default: 'new_finder',
    },
    trustUpdatedAt: { type: Date },
    pointsBalance: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    mfaPendingSecret: { type: String },
    mfaLastUsedStep: { type: Number },
    trustedFinder: { type: Boolean, default: false },
    successfulReturns: { type: Number, default: 0 },
    averageRating: { type: Number },
    reviewCount: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    pushTokens: { type: [String], default: [] },
    emailPreferences: { type: emailPreferencesSchema, default: () => ({}) },
    institutionId: { type: String },
    locale: { type: String, enum: ['en', 'fr', 'tw', 'ga', 'ee'] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'users', versionKey: false },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ pointsBalance: -1 });
userSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<UserDoc>('User', userSchema);
