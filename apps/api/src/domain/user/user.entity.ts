import type { EmailPreferences, Locale, UserRole } from '@back2u/shared-types';

import { ConflictError, ValidationError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface UserSnapshot {
  id: Id;
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
  mfaEnabled: boolean;
  /** Active TOTP secret (base32). Only set while MFA is enabled. */
  mfaSecret?: string;
  /** Secret awaiting first-code confirmation during enrollment. */
  mfaPendingSecret?: string;
  /** Highest TOTP time step already accepted — blocks replay within the drift window. */
  mfaLastUsedStep?: number;
  trustedFinder: boolean;
  successfulReturns: number;
  averageRating?: number;
  reviewCount: number;
  badges: string[];
  pushTokens: string[];
  emailPreferences: EmailPreferences;
  institutionId?: Id;
  locale?: Locale;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private state: UserSnapshot) {}

  static rehydrate(state: UserSnapshot): User {
    return new User({ ...state });
  }

  static create(
    input: Omit<
      UserSnapshot,
      | 'createdAt'
      | 'updatedAt'
      | 'roles'
      | 'status'
      | 'reputationScore'
      | 'pointsBalance'
      | 'emailVerified'
      | 'phoneVerified'
      | 'mfaEnabled'
      | 'trustedFinder'
      | 'successfulReturns'
      | 'reviewCount'
      | 'badges'
      | 'pushTokens'
      | 'emailPreferences'
    >,
  ): User {
    const now = new Date();
    return new User({
      ...input,
      roles: ['user'],
      status: 'active',
      reputationScore: 0,
      pointsBalance: 0,
      emailVerified: false,
      phoneVerified: false,
      mfaEnabled: false,
      trustedFinder: false,
      successfulReturns: 0,
      averageRating: undefined,
      reviewCount: 0,
      badges: [],
      pushTokens: [],
      emailPreferences: {
        marketing: true,
        matches: true,
        chat: true,
        reminders: true,
        courier: true,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  get snapshot(): UserSnapshot {
    return { ...this.state };
  }
  get id(): Id {
    return this.state.id;
  }
  get email(): string {
    return this.state.email;
  }
  get passwordHash(): string {
    return this.state.passwordHash;
  }
  get roles(): UserRole[] {
    return [...this.state.roles];
  }

  awardPoints(points: number, reputationDelta = 0): void {
    this.state.pointsBalance += points;
    this.state.reputationScore += reputationDelta;
    this.state.updatedAt = new Date();
  }
  spendPoints(points: number): void {
    if (points > this.state.pointsBalance) throw new ConflictError('Insufficient points');
    this.state.pointsBalance -= points;
    this.state.updatedAt = new Date();
  }
  recordSuccessfulReturn(): void {
    this.state.successfulReturns += 1;
    if (this.state.successfulReturns >= 5 && !this.state.badges.includes('hero_finder')) {
      this.state.badges.push('hero_finder');
    }
    if (this.state.successfulReturns >= 25 && !this.state.badges.includes('trusted_guardian')) {
      this.state.badges.push('trusted_guardian');
    }
    this.state.updatedAt = new Date();
  }
  promoteTrustedFinder(): void {
    this.state.trustedFinder = true;
    if (!this.state.roles.includes('trusted_finder')) this.state.roles.push('trusted_finder');
    if (!this.state.badges.includes('trusted_finder')) this.state.badges.push('trusted_finder');
    this.state.updatedAt = new Date();
  }
  verifyEmail(): void {
    this.state.emailVerified = true;
    this.state.updatedAt = new Date();
  }
  verifyPhone(): void {
    this.state.phoneVerified = true;
    this.state.updatedAt = new Date();
  }
  changePasswordHash(newHash: string): void {
    this.state.passwordHash = newHash;
    this.state.updatedAt = new Date();
  }
  get mfaEnabled(): boolean {
    return this.state.mfaEnabled === true;
  }
  beginMfaEnrollment(secret: string): void {
    if (this.state.mfaEnabled) throw new ConflictError('MFA is already enabled');
    this.state.mfaPendingSecret = secret;
    this.state.updatedAt = new Date();
  }
  enableMfa(): void {
    if (!this.state.mfaPendingSecret) throw new ConflictError('No MFA enrollment in progress');
    this.state.mfaSecret = this.state.mfaPendingSecret;
    this.state.mfaPendingSecret = undefined;
    this.state.mfaEnabled = true;
    this.state.updatedAt = new Date();
  }
  disableMfa(): void {
    this.state.mfaEnabled = false;
    this.state.mfaSecret = undefined;
    this.state.mfaPendingSecret = undefined;
    this.state.mfaLastUsedStep = undefined;
    this.state.updatedAt = new Date();
  }
  /** True if this TOTP step was already consumed (replay). */
  isMfaStepUsed(step: number): boolean {
    return this.state.mfaLastUsedStep !== undefined && step <= this.state.mfaLastUsedStep;
  }
  markMfaStepUsed(step: number): void {
    this.state.mfaLastUsedStep = Math.max(step, this.state.mfaLastUsedStep ?? -1);
    this.state.updatedAt = new Date();
  }
  addPushToken(token: string): void {
    if (!this.state.pushTokens.includes(token)) this.state.pushTokens.push(token);
    this.state.updatedAt = new Date();
  }
  removePushToken(token: string): void {
    this.state.pushTokens = this.state.pushTokens.filter((t) => t !== token);
    this.state.updatedAt = new Date();
  }
  setLocale(locale: Locale): void {
    this.state.locale = locale;
    this.state.updatedAt = new Date();
  }
  updateStatus(status: 'active' | 'banned' | 'suspended'): void {
    this.state.status = status;
    this.state.updatedAt = new Date();
  }
  updateRoles(roles: UserRole[]): void {
    this.state.roles = [...roles];
    this.state.updatedAt = new Date();
  }
  updateRating(average: number, count: number): void {
    this.state.averageRating = count > 0 ? Number(average.toFixed(2)) : undefined;
    this.state.reviewCount = count;
    this.state.updatedAt = new Date();
  }
  updateProfile(input: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    emailPreferences?: EmailPreferences;
  }): void {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length === 0) throw new ValidationError('Name cannot be empty');
      this.state.name = name;
    }
    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      const next = phone.length > 0 ? phone : undefined;
      if (next !== this.state.phone) {
        this.state.phone = next;
        // Changing the phone number invalidates any prior phone verification.
        this.state.phoneVerified = false;
      }
    }
    if (input.avatarUrl !== undefined) {
      const avatarUrl = input.avatarUrl.trim();
      this.state.avatarUrl = avatarUrl.length > 0 ? avatarUrl : undefined;
    }
    if (input.emailPreferences !== undefined) {
      this.state.emailPreferences = { ...this.state.emailPreferences, ...input.emailPreferences };
    }
    this.state.updatedAt = new Date();
  }
}
