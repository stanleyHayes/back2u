import type { Locale, UserRole } from '@back2u/shared-types';

import type { Id } from '../../domain/shared/id.js';

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface AccessTokenClaims {
  sub: Id;
  roles: UserRole[];
  email: string;
  /** Present for institution-scoped roles (e.g. partner_admin). */
  institutionId?: Id;
}

export interface ITokenService {
  signAccess(claims: AccessTokenClaims): { token: string; expiresAt: Date };
  signRefresh(sub: Id): { token: string; expiresAt: Date };
  signShortLived(payload: Record<string, unknown>, ttlSeconds: number): string;
  verifyAccess(token: string): AccessTokenClaims;
  verifyRefresh(token: string): { sub: Id };
  verifyShortLived<T = Record<string, unknown>>(token: string): T;
}

export interface IEmailService {
  sendWelcome(to: string, name: string, locale?: Locale): Promise<void>;
  sendMatchAlert(to: string, name: string, itemTitle: string, matchUrl: string, locale?: Locale): Promise<void>;
  sendChatNotification(to: string, name: string, threadUrl: string, locale?: Locale): Promise<void>;
  sendPasswordReset(to: string, name: string, resetUrl: string, locale?: Locale): Promise<void>;
  sendTagScanContact(to: string, ownerName: string, finderMessage: string, replyUrl: string): Promise<void>;
  sendExpiryReminder(to: string, name: string, itemTitle: string, itemUrl: string, locale?: Locale): Promise<void>;
  sendUrgentExpiryReminder(to: string, name: string, itemTitle: string, itemUrl: string, locale?: Locale): Promise<void>;
  sendCourierUpdate(to: string, name: string, subject: string, body: string, locale?: Locale): Promise<void>;
  sendMarketplaceAlert(to: string, name: string, subject: string, body: string, locale?: Locale): Promise<void>;
  sendGenericNotification(to: string, name: string, subject: string, body: string, locale?: Locale): Promise<void>;
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export interface IImageStorage {
  signUpload(folder: string): UploadSignature;
  fetchBytes(publicUrl: string): Promise<Uint8Array>;
}

export interface IAiMatchingService {
  embedText(text: string): Promise<number[]>;
  embedImage(imageUrl: string): Promise<number[]>;
  describeImage(imageUrl: string): Promise<{ title: string; description: string; tags: string[] }>;
  cosine(a: number[], b: number[]): number;
}

export interface IContentModeration {
  scoreMessage(body: string): Promise<{ flagged: boolean; reason?: string }>;
}

export interface TextGenerationRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

/** Generic LLM text generation (writing assistant, etc.). */
export interface ITextGenerationService {
  generate(req: TextGenerationRequest): Promise<string>;
}

export interface IGeocodingService {
  forward(query: string): Promise<{ name: string; lng: number; lat: number; city?: string; country?: string } | null>;
  /** Return multiple ranked place suggestions for an autocomplete experience. */
  suggest(
    query: string,
    opts?: { limit?: number; proximity?: { lng: number; lat: number }; country?: string },
  ): Promise<Array<{ name: string; lng: number; lat: number; city?: string; country?: string }>>;
  reverse(lng: number, lat: number): Promise<{ name: string; city?: string; country?: string } | null>;
}

export interface IRealtimeBus {
  publishToUser(userId: Id, event: string, payload: unknown): void;
  publishToThread(threadId: Id, event: string, payload: unknown): void;
}

export interface IClock {
  now(): Date;
}

export interface ILogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

// === New service ports ===

export interface ISmsService {
  sendOtp(toPhone: string, code: string, locale?: Locale): Promise<void>;
  send(toPhone: string, body: string): Promise<void>;
  parseInbound(payload: unknown): { fromPhone: string; body: string } | null;
}

export interface IPushService {
  send(tokens: string[], title: string, body: string, data?: Record<string, unknown>): Promise<void>;
}

export interface IPaymentEscrowService {
  hold(input: { rewardId: Id; amount: number; currency: string; payerPhone?: string }): Promise<{ providerRef: string }>;
  release(input: { providerRef: string; recipientPhone: string }): Promise<void>;
  refund(providerRef: string): Promise<void>;
}

export interface IPerceptualHashService {
  hash(imageBytes: Uint8Array): Promise<string>;
  hammingDistance(a: string, b: string): number;
  isDuplicate(a: string, b: string, threshold?: number): boolean;
}

export interface IPdfReportService {
  buildStolenItemReport(input: {
    item: { title: string; description: string; serialNumber?: string; imei?: string; place: string; occurredAt: Date };
    user: { name: string; email: string; phone?: string };
  }): Promise<{ url: string }>;
}

export interface II18nService {
  t(key: string, locale?: Locale, vars?: Record<string, string | number>): string;
}

export interface IAiVerificationService {
  scoreClaimConsistency(input: {
    item: { title: string; description: string; tags: string[] };
    answers: { questionId: string; prompt: string; answer: string }[];
    proofs: { kind: string; text?: string; url?: string }[];
  }): Promise<{ score: number; reasoning: string }>;
}

export interface IErrorReporter {
  /** Report an error to the external tracker (Sentry, Datadog, etc.). */
  report(error: Error, context?: Record<string, unknown>): void;
  /** Legacy alias for `report`; prefer `report` for new call sites. */
  capture(err: unknown, context?: Record<string, unknown>): void;
  /** Send a plain message to the tracker. */
  captureMessage(message: string, level?: string): void;
  /** Run a function inside a scoped context. */
  withScope<T>(meta: Record<string, unknown>, fn: () => T): T;
}
