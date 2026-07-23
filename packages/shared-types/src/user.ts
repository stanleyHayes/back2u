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
