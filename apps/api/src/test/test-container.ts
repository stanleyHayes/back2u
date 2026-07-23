import 'reflect-metadata';
import { Container } from 'inversify';
import type { Locale } from '@back2u/shared-types';

import { buildContainer } from '../composition/container.js';
import { TOKENS } from '../application/ports/tokens.js';
import type { Env } from '../config/env.js';
import type {
  IAiMatchingService,
  IAiVerificationService,
  IContentModeration,
  IEmailService,
  IErrorReporter,
  IGeocodingService,
  IImageStorage,
  ILogger,
  IPaymentEscrowService,
  IPdfReportService,
  IPerceptualHashService,
  IPushService,
  IRealtimeBus,
  ISmsService,
  UploadSignature,
} from '../application/ports/services.js';
import type { II18nService } from '../application/ports/services.js';
import type { IQueue, IQueueWorker, JobName } from '../application/ports/queue.js';
import type {
  IAppUrls,
  IScheduler,
  ITwilioSignatureVerifier,
  IWebPushService,
} from '../application/ports/extra-services.js';
import type { IWebPushSubscriptionRepository } from '../infrastructure/persistence/mongo/repositories/web-push.repo.mongo.js';
import type { ICache } from '../application/ports/cache.js';

class NoopLogger implements ILogger {
  info() {}
  warn() {}
  error() {}
}

class NoopEmailService implements IEmailService {
  async sendWelcome() {}
  async sendMatchAlert() {}
  async sendChatNotification() {}
  async sendPasswordReset() {}
  async sendTagScanContact() {}
  async sendExpiryReminder() {}
  async sendUrgentExpiryReminder() {}
  async sendCourierUpdate() {}
  async sendMarketplaceAlert() {}
  async sendGenericNotification() {}
}

class NoopSmsService implements ISmsService {
  async sendOtp() {}
  async send() {}
  parseInbound(): null {
    return null;
  }
}

class NoopPushService implements IPushService {
  async send() {}
}

class NoopWebPushService implements IWebPushService {
  async send() {}
  vapidPublicKey(): string | null {
    return null;
  }
}

class NoopPaymentEscrow implements IPaymentEscrowService {
  async hold() {
    return { providerRef: 'test-ref' };
  }
  async release() {}
  async refund() {}
}

class NoopImageStorage implements IImageStorage {
  signUpload(): UploadSignature {
    return { signature: 's', timestamp: 1, cloudName: 'c', apiKey: 'k', folder: 'f' };
  }
  async fetchBytes() {
    return new Uint8Array(0);
  }
}

class StubAiMatchingService implements IAiMatchingService {
  async embedText() {
    return new Array(384).fill(0.1);
  }
  async embedImage() {
    return new Array(384).fill(0.1);
  }
  async describeImage() {
    return { title: 't', description: 'd', tags: [] };
  }
  cosine(): number {
    return 1.0;
  }
}

class NoopContentModeration implements IContentModeration {
  async scoreMessage() {
    return { flagged: false };
  }
}

class NoopGeocoding implements IGeocodingService {
  async forward() {
    return null;
  }
  async suggest() {
    return [];
  }
  async reverse() {
    return null;
  }
}

class NoopRealtimeBus implements IRealtimeBus {
  publishToUser() {}
  publishToThread() {}
}

class NoopPerceptualHash implements IPerceptualHashService {
  async hash() {
    return 'abc123';
  }
  hammingDistance(): number {
    return 0;
  }
  isDuplicate(): boolean {
    return false;
  }
}

class NoopPdfReport implements IPdfReportService {
  async buildStolenItemReport() {
    return { url: 'https://example.com/report.pdf' };
  }
}

class NoopI18n implements II18nService {
  t(key: string): string {
    return key;
  }
}

class NoopAiVerification implements IAiVerificationService {
  async scoreClaimConsistency() {
    return { score: 1, reasoning: '' };
  }
}

class NoopErrorReporter implements IErrorReporter {
  capture() {}
  report() {}
  captureMessage() {}
  withScope<T>(_meta: Record<string, unknown>, fn: () => T): T {
    return fn();
  }
}

class NoopScheduler implements IScheduler {
  every() {}
  start() {}
  stop() {}
}

class NoopQueue implements IQueue {
  async enqueue() {}
  async scheduleJob() {}
  async close() {}
}

class NoopQueueWorker implements IQueueWorker {
  async on() {}
  async start() {}
  async stop() {}
}

class NoopTwilioSignature implements ITwilioSignatureVerifier {
  verify(): boolean {
    return true;
  }
}

class NoopWebPushSubscriptionRepo implements IWebPushSubscriptionRepository {
  async save() {}
  async listForUser() {
    return [];
  }
  async deleteByEndpoint() {}
}

class NoopCache implements ICache {
  async get<T>(): Promise<T | null> { return null; }
  async set(): Promise<void> {}
  async del(): Promise<void> {}
  async invalidatePattern(): Promise<void> {}
}

export function buildTestContainer(envOverride?: Env): Container {
  const c = buildContainer(envOverride);

  c.rebind<ILogger>(TOKENS.Logger).toConstantValue(new NoopLogger());
  c.rebind<IEmailService>(TOKENS.EmailService).toConstantValue(new NoopEmailService());
  c.rebind<ISmsService>(TOKENS.SmsService).toConstantValue(new NoopSmsService());
  c.rebind<IPushService>(TOKENS.PushService).toConstantValue(new NoopPushService());
  c.rebind<IWebPushService>(TOKENS.WebPushService).toConstantValue(new NoopWebPushService());
  c.rebind<IPaymentEscrowService>(TOKENS.PaymentEscrow).toConstantValue(new NoopPaymentEscrow());
  c.rebind<IImageStorage>(TOKENS.ImageStorage).toConstantValue(new NoopImageStorage());
  c.rebind<IAiMatchingService>(TOKENS.AiMatchingService).toConstantValue(new StubAiMatchingService());
  c.rebind<IAiVerificationService>(TOKENS.AiVerificationService).toConstantValue(new NoopAiVerification());
  c.rebind<IContentModeration>(TOKENS.ContentModeration).toConstantValue(new NoopContentModeration());
  c.rebind<IGeocodingService>(TOKENS.GeocodingService).toConstantValue(new NoopGeocoding());
  c.rebind<IRealtimeBus>(TOKENS.RealtimeBus).toConstantValue(new NoopRealtimeBus());
  c.rebind<IPerceptualHashService>(TOKENS.PerceptualHash).toConstantValue(new NoopPerceptualHash());
  c.rebind<IPdfReportService>(TOKENS.PdfReportService).toConstantValue(new NoopPdfReport());
  c.rebind<II18nService>(TOKENS.I18nService).toConstantValue(new NoopI18n());
  c.rebind<IErrorReporter>(TOKENS.ErrorReporter).toConstantValue(new NoopErrorReporter());
  c.rebind<IScheduler>(TOKENS.Scheduler).toConstantValue(new NoopScheduler());
  c.rebind<IQueue>(TOKENS.Queue).toConstantValue(new NoopQueue());
  c.rebind<IQueueWorker>(TOKENS.QueueWorker).toConstantValue(new NoopQueueWorker());
  c.rebind<ITwilioSignatureVerifier>(TOKENS.TwilioSignatureVerifier).toConstantValue(new NoopTwilioSignature());
  c.rebind<IWebPushSubscriptionRepository>(TOKENS.WebPushSubscriptionRepository).toConstantValue(
    new NoopWebPushSubscriptionRepo(),
  );
  c.rebind<ICache>(TOKENS.Cache).toConstantValue(new NoopCache());

  return c;
}
