import mongoose from 'mongoose';

import type { EmailPreferences, Locale, UserRole } from '@back2u/shared-types';

export interface UserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  phone?: string;
  avatarUrl?: string;
  roles: UserRole[];
  status: 'active' | 'banned' | 'suspended';
  reputationScore: number;
  pointsBalance: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustedFinder: boolean;
  successfulReturns: number;
  averageRating?: number;
  reviewCount: number;
  badges: string[];
  pushTokens: string[];
  emailPreferences: EmailPreferences;
  institutionId?: string;
  locale?: Locale;
  createdAt: Date;
  updatedAt: Date;
}

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
    roles: {
      type: [String],
      enum: ['user', 'finder', 'trusted_finder', 'courier', 'partner_admin', 'admin', 'super_admin'],
      default: ['user'],
    },
    status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active' },
    reputationScore: { type: Number, default: 0 },
    pointsBalance: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
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
