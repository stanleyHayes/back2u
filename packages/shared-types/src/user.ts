import type { Locale, UserRole } from './enums.js';

export interface EmailPreferences {
  marketing?: boolean;
  matches?: boolean;
  chat?: boolean;
  reminders?: boolean;
  courier?: boolean;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  roles: UserRole[];
  status?: 'active' | 'banned' | 'suspended';
  reputationScore: number;
  pointsBalance: number;
  successfulReturns?: number;
  averageRating?: number;
  reviewCount?: number;
  emailVerified: boolean;
  phoneVerified?: boolean;
  mfaEnabled?: boolean;
  trustedFinder?: boolean;
  institutionId?: string;
  locale?: Locale;
  badges?: string[];
  pushTokens?: string[];
  emailPreferences: EmailPreferences;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  emailPreferences?: EmailPreferences;
}

export interface AuthResponse {
  user: UserDTO;
  tokens: AuthTokens;
}

/**
 * Returned by /auth/login instead of AuthResponse when the account has MFA
 * enabled: the client must call /auth/mfa/verify with the short-lived
 * mfaToken plus a TOTP code to complete the sign-in.
 */
export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
}

export type LoginResponse = AuthResponse | MfaChallengeResponse;

export interface MfaSetupResponse {
  /** Base32 secret for manual entry into an authenticator app. */
  secret: string;
  /** otpauth:// URL, renderable as a QR code. */
  otpauthUrl: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
