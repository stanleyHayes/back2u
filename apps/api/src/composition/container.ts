import 'reflect-metadata';

import { Container } from 'inversify';

import {
  ListAuditLogsUseCase,
  WriteAuditLogUseCase,
} from '../application/use-cases/audit/audit.use-cases.js';
import { CrowdsourcedHeartbeatUseCase } from '../application/use-cases/ble/heartbeat.use-case.js';
import {
  GetMessagesUseCase,
  ListThreadsUseCase,
} from '../application/use-cases/chat/list-threads.js';
import { AutocompleteSearchUseCase } from '../application/use-cases/item/autocomplete-search.js';
import { SuggestPlacesUseCase } from '../application/use-cases/geo/suggest-places.js';
import { AiAssistUseCase } from '../application/use-cases/ai/ai-assist.use-case.js';
import { ListRewardPartnersUseCase } from '../application/use-cases/rewards/list-reward-partners.use-case.js';
import { UpdateRewardsProfileUseCase } from '../application/use-cases/rewards/update-rewards-profile.use-case.js';
import { BumpItemUseCase } from '../application/use-cases/item/bump-item.js';
import { ClearItemReviewFlagUseCase } from '../application/use-cases/item/clear-review-flag.js';
import { CreateItemUseCase } from '../application/use-cases/item/create-item.js';
import { DetectDuplicateItemUseCase } from '../application/use-cases/item/detect-duplicate-item.js';
import { GetItemUseCase } from '../application/use-cases/item/get-item.js';
import { ListFlaggedItemsUseCase } from '../application/use-cases/item/list-flagged-items.js';
import { ListItemsUseCase } from '../application/use-cases/item/list-items.js';
import { UpdateItemUseCase } from '../application/use-cases/item/update-item.js';
import { LoginUserUseCase } from '../application/use-cases/auth/login-user.js';
import {
  ChangePasswordUseCase,
  DisableMfaUseCase,
  EnableMfaUseCase,
  SetupMfaUseCase,
  VerifyMfaLoginUseCase,
} from '../application/use-cases/auth/mfa.use-cases.js';
import { RegisterUserUseCase } from '../application/use-cases/auth/register-user.js';
import {
  LogoutUseCase,
  RefreshSessionUseCase,
} from '../application/use-cases/auth/refresh-session.js';
import {
  ExportMyDataUseCase,
  RedeemPointsUseCase,
  RegisterPushTokenUseCase,
  SetLocaleUseCase,
  UpdateProfileUseCase,
} from '../application/use-cases/auth/me-extras.use-cases.js';
import {
  ComprehensiveExportUseCase,
  DeleteAccountUseCase,
} from '../application/use-cases/account/account.use-cases.js';
import {
  ConfirmEmailVerificationUseCase,
  RequestEmailVerificationUseCase,
} from '../application/use-cases/email_verify/email-verify.use-cases.js';
import {
  ConfirmPasswordResetUseCase,
  RequestPasswordResetUseCase,
} from '../application/use-cases/password_reset/password-reset.use-cases.js';
import {
  RequestPhoneOtpUseCase,
  VerifyPhoneOtpUseCase,
} from '../application/use-cases/phone_otp/phone-otp.use-cases.js';
import {
  AcceptMatchUseCase,
  RejectMatchUseCase,
} from '../application/use-cases/match/decide-match.js';
import { ConfirmItemReturnUseCase } from '../application/use-cases/match/confirm-item-return.js';
import { GenerateMatchesUseCase } from '../application/use-cases/match/generate-matches.js';
import { ListMatchesForItemUseCase } from '../application/use-cases/match/list-matches-for-item.js';
import { MarkMessageReadUseCase } from '../application/use-cases/chat/mark-message-read.js';
import { PostMessageUseCase } from '../application/use-cases/chat/post-message.js';
import { SendTypingUseCase } from '../application/use-cases/chat/send-typing.js';
import { ReleaseRewardUseCase } from '../application/use-cases/reward/release-reward.js';
import { GenerateUploadSignatureUseCase } from '../application/use-cases/upload/generate-upload-signature.js';
import {
  AcceptCourierJobUseCase,
  CalculateRouteUseCase,
  GetCourierJobUseCase,
  ListMyCourierJobsUseCase,
  ListNearbyCourierJobsUseCase,
  ListOpenCourierJobsUseCase,
  RequestCourierJobUseCase,
  TransitionCourierJobUseCase,
} from '../application/use-cases/courier/courier.use-cases.js';
import { DescribeImageUseCase } from '../application/use-cases/ai_describe/describe-image.use-case.js';
import { GetLeaderboardUseCase } from '../application/use-cases/leaderboard/leaderboard.use-cases.js';
import { GetShareCardUseCase } from '../application/use-cases/share/share-card.use-cases.js';
import {
  DecideInstitutionLeadUseCase,
  GetInstitutionUseCase,
  ListInstitutionLeadsUseCase,
  ListInstitutionsUseCase,
  OnboardInstitutionUseCase,
  SubmitInstitutionLeadUseCase,
  SubscribeInstitutionUseCase,
} from '../application/use-cases/institution/institution.use-cases.js';
import {
  ListUsersUseCase,
  UpdateUserRolesUseCase,
  UpdateUserStatusUseCase,
} from '../application/use-cases/user/user.use-cases.js';
import {
  CreateWebhookUseCase,
  DeleteWebhookUseCase,
  DeliverWebhookUseCase,
  ListWebhooksUseCase,
  UpdateWebhookUseCase,
} from '../application/use-cases/webhook/webhook.use-cases.js';
import { GetAdminStatsUseCase } from '../application/use-cases/admin/get-admin-stats.js';
import { GetPartnerStatsUseCase } from '../application/use-cases/admin/get-partner-stats.js';
import {
  GetMarketplaceListingUseCase,
  ListLiveMarketplaceUseCase,
  ListMyBidsUseCase,
  ListUnclaimedAsAuctionUseCase,
  PlaceBidUseCase,
  SettleMarketplaceAuctionUseCase,
} from '../application/use-cases/marketplace/marketplace.use-cases.js';
import {
  CountUnreadNotificationsUseCase,
  CreateNotificationUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '../application/use-cases/notification/notification.use-cases.js';
import {
  FilePoliceCaseUseCase,
  GenerateStolenItemReportUseCase,
} from '../application/use-cases/announcement/police-case.use-cases.js';
import { HandleInboundSmsUseCase } from '../application/use-cases/sms/sms-inbound.use-case.js';
import {
  BlockUserUseCase,
  DecideReportUseCase,
  FileReportUseCase,
  ListBlocksUseCase,
  ListOpenReportsUseCase,
  UnblockUserUseCase,
} from '../application/use-cases/safety/safety.use-cases.js';
import {
  ListModerationQueueUseCase,
  ReviewModerationItemUseCase,
} from '../application/use-cases/moderation/moderation.use-cases.js';
import {
  ClaimQrTagUseCase,
  CreateQrTagOrderUseCase,
  FulfilQrTagOrderUseCase,
  PayForQrTagOrderUseCase,
  HandlePaystackWebhookUseCase,
  GetTagByCodeUseCase,
  ListMyTagsUseCase,
  ListMyQrTagOrdersUseCase,
  ListQrTagProductsUseCase,
  MarkTagLostUseCase,
  MintQrTagsUseCase,
  RecordTagHeartbeatUseCase,
  ScanQrTagUseCase,
} from '../application/use-cases/tag/qr-tag.use-cases.js';
import {
  CreateVaultEntryUseCase,
  DeleteVaultEntryUseCase,
  ListVaultEntriesUseCase,
} from '../application/use-cases/vault/vault.use-cases.js';
import {
  DecideVerificationUseCase,
  GetVerificationQuestionsUseCase,
  ListPendingVerificationsUseCase,
  SubmitVerificationUseCase,
} from '../application/use-cases/verification/verification.use-cases.js';
import {
  CreateZoneSubscriptionUseCase,
  DeleteZoneSubscriptionUseCase,
  ListMyZoneSubscriptionsUseCase,
} from '../application/use-cases/subscription/zone.use-cases.js';
import {
  BookmarkItemUseCase,
  ListMyBookmarksUseCase,
  UnbookmarkItemUseCase,
} from '../application/use-cases/bookmark/bookmark.use-cases.js';
import {
  ListPartnerItemsUseCase,
  GetPartnerItemUseCase,
  CreatePartnerItemUseCase,
  UpdatePartnerItemStatusUseCase,
  CreatePartnerApiKeyUseCase,
  ListPartnerApiKeysUseCase,
  RevokePartnerApiKeyUseCase,
} from '../application/use-cases/partner-api/index.js';
import {
  CreateReviewUseCase,
  GetMyReviewForMatchUseCase,
  ListReviewsForUserUseCase,
} from '../application/use-cases/review/review.use-cases.js';
import {
  GetFeatureFlagsUseCase,
  IsFeatureEnabledUseCase,
  ToggleFeatureFlagUseCase,
  UpdateRolloutUseCase,
  SeedFeatureFlagsUseCase,
} from '../application/use-cases/feature-flag/feature-flag.use-cases.js';
import { TOKENS } from '../application/ports/tokens.js';
import {
  ApplyTrustedFinderUseCase,
  DecideTrustedFinderApplicationUseCase,
  ListTrustedFinderApplicationsUseCase,
} from '../application/use-cases/trusted-finder/trusted-finder.use-cases.js';
import type {
  IInstitutionLeadRepository,
  IAuditLogRepository,
  ICourierJobRepository,
  IInstitutionRepository,
  IItemRepository,
  IMarketplaceListingRepository,
  IMatchRepository,
  IMessageRepository,
  IBookmarkRepository,
  IModerationQueueRepository,
  INotificationRepository,
  IPoliceCaseRepository,
  IQrTagRepository,
  IQrTagProductRepository,
  IQrTagOrderRepository,
  IRewardRepository,
  IThreadRepository,
  IUserRepository,
  IVaultRepository,
  IVerificationRepository,
  IWebhookRepository,
  IZoneSubscriptionRepository,
  ITrustedFinderApplicationRepository,
  IReviewRepository,
  IFeatureFlagRepository,
  IPartnerApiKeyRepository,
} from '../application/ports/repositories.js';
import type {
  IIdempotencyStore,
  IOtpRepository,
  IPasswordResetRepository,
  IRefreshTokenRepository,
} from '../application/ports/auth-repos.js';
import type { IBlockRepository, IReportRepository } from '../application/ports/safety-repos.js';
import type {
  IAppUrls,
  IScheduler,
  ITwilioSignatureVerifier,
  IWebPushService,
} from '../application/ports/extra-services.js';
import { AppUrls } from '../infrastructure/config/app-urls.js';
import type { IQueue, IQueueWorker } from '../application/ports/queue.js';
import type { IVaultCipher } from '../application/ports/crypto.js';
import type {
  IAiMatchingService,
  IAiVerificationService,
  IClock,
  IContentModeration,
  IEmailService,
  IErrorReporter,
  IGeocodingService,
  II18nService,
  IImageStorage,
  ILogger,
  IPasswordHasher,
  IPaymentEscrowService,
  IPdfReportService,
  IPerceptualHashService,
  IPushService,
  IRealtimeBus,
  ISmsService,
  ITextGenerationService,
  ITokenService,
} from '../application/ports/services.js';
import { loadEnv, type Env } from '../config/env.js';
import { AnthropicMatchingService } from '../infrastructure/ai/anthropic/anthropic.matching-service.js';
import { AnthropicModeration } from '../infrastructure/ai/anthropic/anthropic.moderation-service.js';
import { AnthropicVerificationService } from '../infrastructure/ai/anthropic/anthropic.verification.js';
import { AnthropicTextGenerationService } from '../infrastructure/ai/anthropic/anthropic.text-generation-service.js';
import { ResendEmailService } from '../infrastructure/email/resend/resend.email-service.js';
import { StaticI18nService } from '../infrastructure/i18n/i18n.service.js';
import { MapboxGeocoding } from '../infrastructure/maps/mapbox/mapbox.geocoding.js';
import { LibsodiumVaultCipher } from '../infrastructure/crypto/libsodium.cipher.js';
import { CompositeErrorReporter } from '../infrastructure/observability/composite.reporter.js';
import { HubtelMomoEscrow } from '../infrastructure/payments/momo/hubtel.escrow.js';
import { BullmqQueue } from '../infrastructure/queue/bullmq.queue.js';
import { BullmqWorker } from '../infrastructure/queue/bullmq.worker.js';
import { ShaPerceptualHash } from '../infrastructure/perceptual_hash/sharp.phash.js';
import { MongoAuditLogRepository } from '../infrastructure/persistence/mongo/repositories/audit.repository.mongo.js';
import {
  MongoIdempotencyStore,
  MongoOtpRepository,
  MongoPasswordResetRepository,
  MongoRefreshTokenRepository,
} from '../infrastructure/persistence/mongo/repositories/auth.repos.mongo.js';
import { MongoCourierJobRepository } from '../infrastructure/persistence/mongo/repositories/courier.repository.mongo.js';
import { MongoInstitutionRepository } from '../infrastructure/persistence/mongo/repositories/institution.repository.mongo.js';
import { MongoInstitutionLeadRepository } from '../infrastructure/persistence/mongo/repositories/institution-lead.repository.mongo.js';
import { MongoRedemptionRepository } from '../infrastructure/persistence/mongo/repositories/redemption.repository.mongo.js';
import type { IRedemptionRepository } from '../application/ports/redemption-repo.js';
import {
  ConfirmRedemptionUseCase,
  CreateRedemptionUseCase,
  ListInstitutionRedemptionsUseCase,
  ListMyRedemptionsUseCase,
} from '../application/use-cases/redemption/redemption.use-cases.js';
import { MongoItemRepository } from '../infrastructure/persistence/mongo/repositories/item.repository.mongo.js';
import { MongoMarketplaceListingRepository } from '../infrastructure/persistence/mongo/repositories/marketplace.repository.mongo.js';
import { MongoMatchRepository } from '../infrastructure/persistence/mongo/repositories/match.repository.mongo.js';
import {
  MongoMessageRepository,
  MongoThreadRepository,
} from '../infrastructure/persistence/mongo/repositories/chat.repository.mongo.js';
import { MongoPoliceCaseRepository } from '../infrastructure/persistence/mongo/repositories/police-case.repository.mongo.js';
import { MongoQrTagRepository } from '../infrastructure/persistence/mongo/repositories/qr-tag.repository.mongo.js';
import { MongoQrTagProductRepository } from '../infrastructure/persistence/mongo/repositories/qr-tag-product.repository.mongo.js';
import { MongoQrTagOrderRepository } from '../infrastructure/persistence/mongo/repositories/qr-tag-order.repository.mongo.js';
import { MongoRewardRepository } from '../infrastructure/persistence/mongo/repositories/reward.repository.mongo.js';
import {
  MongoBlockRepository,
  MongoReportRepository,
} from '../infrastructure/persistence/mongo/repositories/safety.repos.mongo.js';
import { MongoModerationQueueRepository } from '../infrastructure/persistence/mongo/repositories/moderation.repository.mongo.js';
import { MongoUserRepository } from '../infrastructure/persistence/mongo/repositories/user.repository.mongo.js';
import { MongoVaultRepository } from '../infrastructure/persistence/mongo/repositories/vault.repository.mongo.js';
import { MongoVerificationRepository } from '../infrastructure/persistence/mongo/repositories/verification.repository.mongo.js';
import { MongoZoneSubscriptionRepository } from '../infrastructure/persistence/mongo/repositories/zone.repository.mongo.js';
import { MongoNotificationRepository } from '../infrastructure/persistence/mongo/repositories/notification.repository.mongo.js';
import { MongoWebhookRepository } from '../infrastructure/persistence/mongo/repositories/webhook.repository.mongo.js';
import { MongoBookmarkRepository } from '../infrastructure/persistence/mongo/repositories/bookmark.repository.mongo.js';
import { MongoTrustedFinderApplicationRepository } from '../infrastructure/persistence/mongo/repositories/trusted-finder-application.repository.mongo.js';
import { MongoPartnerApiKeyRepository } from '../infrastructure/persistence/mongo/repositories/partner-api-key.repository.mongo.js';
import { MongoReviewRepository } from '../infrastructure/persistence/mongo/repositories/review.repository.mongo.js';
import { MongoFeatureFlagRepository } from '../infrastructure/persistence/mongo/repositories/feature-flag.repository.mongo.js';
import {
  MongoWebPushSubscriptionRepository,
  type IWebPushSubscriptionRepository,
} from '../infrastructure/persistence/mongo/repositories/web-push.repo.mongo.js';
import { ExpoPushService } from '../infrastructure/push/expo.push-service.js';
import { WebPushService } from '../infrastructure/push/web-push.service.js';
import { PdfKitReportService } from '../infrastructure/storage/cloudinary/cloudinary.pdf-report.js';
import { InProcessScheduler } from '../infrastructure/scheduler/in-process.scheduler.js';
import { Argon2Hasher } from '../infrastructure/security/argon2.hasher.js';
import { JwtTokenService } from '../infrastructure/security/jwt.token-service.js';
import { PinoAppLogger } from '../infrastructure/security/pino-logger.js';
import { SystemClock } from '../infrastructure/security/system-clock.js';
import { CloudinaryImageStorage } from '../infrastructure/storage/cloudinary/cloudinary.image-storage.js';
import { SocketIoBus } from '../infrastructure/realtime/socketio.bus.js';
import { TwilioSmsService } from '../infrastructure/sms/twilio/twilio.sms-service.js';
import { TwilioSignatureVerifier } from '../infrastructure/sms/twilio/twilio.signature.js';
import { RedisCache } from '../infrastructure/cache/redis-cache.js';
import { PaystackService } from '../infrastructure/payments/paystack/paystack.service.js';
import type { ICache } from '../application/ports/cache.js';

export function buildContainer(envOverride?: Env): Container {
  const c = new Container({ defaultScope: 'Singleton' });
  const env = envOverride ?? loadEnv();

  c.bind<Env>(TOKENS.Env).toConstantValue(env);
  c.bind<ILogger>(TOKENS.Logger).to(PinoAppLogger);
  c.bind(PinoAppLogger).toSelf();
  c.bind<IClock>(TOKENS.Clock).to(SystemClock);
  c.bind<IAppUrls>(TOKENS.AppUrls).to(AppUrls);

  // Repositories
  c.bind<IItemRepository>(TOKENS.ItemRepository).to(MongoItemRepository);
  c.bind<IUserRepository>(TOKENS.UserRepository).to(MongoUserRepository);
  c.bind<IMatchRepository>(TOKENS.MatchRepository).to(MongoMatchRepository);
  c.bind<IThreadRepository>(TOKENS.ThreadRepository).to(MongoThreadRepository);
  c.bind<IMessageRepository>(TOKENS.MessageRepository).to(MongoMessageRepository);
  c.bind<IRewardRepository>(TOKENS.RewardRepository).to(MongoRewardRepository);
  c.bind<IQrTagRepository>(TOKENS.QrTagRepository).to(MongoQrTagRepository);
  c.bind<IQrTagProductRepository>(TOKENS.QrTagProductRepository).to(MongoQrTagProductRepository);
  c.bind<IQrTagOrderRepository>(TOKENS.QrTagOrderRepository).to(MongoQrTagOrderRepository);
  c.bind<IVerificationRepository>(TOKENS.VerificationRepository).to(MongoVerificationRepository);
  c.bind<ICourierJobRepository>(TOKENS.CourierJobRepository).to(MongoCourierJobRepository);
  c.bind<IVaultRepository>(TOKENS.VaultRepository).to(MongoVaultRepository);
  c.bind<IAuditLogRepository>(TOKENS.AuditLogRepository).to(MongoAuditLogRepository);
  c.bind<IZoneSubscriptionRepository>(TOKENS.ZoneSubscriptionRepository).to(
    MongoZoneSubscriptionRepository,
  );
  c.bind<IMarketplaceListingRepository>(TOKENS.MarketplaceListingRepository).to(
    MongoMarketplaceListingRepository,
  );
  c.bind<IPoliceCaseRepository>(TOKENS.PoliceCaseRepository).to(MongoPoliceCaseRepository);
  c.bind<IInstitutionRepository>(TOKENS.InstitutionRepository).to(MongoInstitutionRepository);
  c.bind<IInstitutionLeadRepository>(TOKENS.InstitutionLeadRepository).to(
    MongoInstitutionLeadRepository,
  );
  c.bind<IRedemptionRepository>(TOKENS.RedemptionRepository).to(MongoRedemptionRepository);
  c.bind<IRefreshTokenRepository>(TOKENS.RefreshTokenRepository).to(MongoRefreshTokenRepository);
  c.bind<IOtpRepository>(TOKENS.OtpRepository).to(MongoOtpRepository);
  c.bind<IPasswordResetRepository>(TOKENS.PasswordResetRepository).to(MongoPasswordResetRepository);
  c.bind<IIdempotencyStore>(TOKENS.IdempotencyStore).to(MongoIdempotencyStore);
  c.bind<IReportRepository>(TOKENS.ReportRepository).to(MongoReportRepository);
  c.bind<IBlockRepository>(TOKENS.BlockRepository).to(MongoBlockRepository);
  c.bind<IModerationQueueRepository>(TOKENS.ModerationQueueRepository).to(
    MongoModerationQueueRepository,
  );
  c.bind<INotificationRepository>(TOKENS.NotificationRepository).to(MongoNotificationRepository);
  c.bind<IWebhookRepository>(TOKENS.WebhookRepository).to(MongoWebhookRepository);
  c.bind<IBookmarkRepository>(TOKENS.BookmarkRepository).to(MongoBookmarkRepository);
  c.bind<ITrustedFinderApplicationRepository>(TOKENS.TrustedFinderApplicationRepository).to(
    MongoTrustedFinderApplicationRepository,
  );
  c.bind<IPartnerApiKeyRepository>(TOKENS.PartnerApiKeyRepository).to(MongoPartnerApiKeyRepository);
  c.bind<IReviewRepository>(TOKENS.ReviewRepository).to(MongoReviewRepository);
  c.bind<IFeatureFlagRepository>(TOKENS.FeatureFlagRepository).to(MongoFeatureFlagRepository);
  c.bind<ICache>(TOKENS.Cache).to(RedisCache);
  c.bind(PaystackService).toSelf();

  // Services
  c.bind<IPasswordHasher>(TOKENS.PasswordHasher).to(Argon2Hasher);
  c.bind<ITokenService>(TOKENS.TokenService).to(JwtTokenService);
  c.bind<II18nService>(TOKENS.I18nService).to(StaticI18nService);
  c.bind<IEmailService>(TOKENS.EmailService).to(ResendEmailService);
  c.bind<ISmsService>(TOKENS.SmsService).to(TwilioSmsService);
  c.bind<ITwilioSignatureVerifier>(TOKENS.TwilioSignatureVerifier).to(TwilioSignatureVerifier);
  c.bind<IPushService>(TOKENS.PushService).to(ExpoPushService);
  c.bind<IWebPushService>(TOKENS.WebPushService).to(WebPushService);
  c.bind<IWebPushSubscriptionRepository>(TOKENS.WebPushSubscriptionRepository).to(
    MongoWebPushSubscriptionRepository,
  );
  c.bind<IPaymentEscrowService>(TOKENS.PaymentEscrow).to(HubtelMomoEscrow);
  c.bind<IImageStorage>(TOKENS.ImageStorage).to(CloudinaryImageStorage);
  c.bind<IAiMatchingService>(TOKENS.AiMatchingService).to(AnthropicMatchingService);
  c.bind<IAiVerificationService>(TOKENS.AiVerificationService).to(AnthropicVerificationService);
  c.bind<IContentModeration>(TOKENS.ContentModeration).to(AnthropicModeration);
  c.bind<ITextGenerationService>(TOKENS.TextGenerationService).to(AnthropicTextGenerationService);
  c.bind<IGeocodingService>(TOKENS.GeocodingService).to(MapboxGeocoding);
  c.bind<IRealtimeBus>(TOKENS.RealtimeBus).to(SocketIoBus);
  c.bind<IPerceptualHashService>(TOKENS.PerceptualHash).to(ShaPerceptualHash);
  c.bind<IPdfReportService>(TOKENS.PdfReportService).to(PdfKitReportService);
  c.bind<IErrorReporter>(TOKENS.ErrorReporter).to(CompositeErrorReporter);
  c.bind<IScheduler>(TOKENS.Scheduler).to(InProcessScheduler);
  c.bind<IQueue>(TOKENS.Queue).to(BullmqQueue);
  c.bind<IQueueWorker>(TOKENS.QueueWorker).to(BullmqWorker);
  c.bind<IVaultCipher>(TOKENS.VaultCipher).to(LibsodiumVaultCipher);
  c.bind(SocketIoBus).toSelf();

  // Use-cases
  c.bind(GenerateMatchesUseCase).toSelf();
  c.bind(RegisterUserUseCase).toSelf();
  c.bind(LoginUserUseCase).toSelf();
  c.bind(SetupMfaUseCase).toSelf();
  c.bind(EnableMfaUseCase).toSelf();
  c.bind(DisableMfaUseCase).toSelf();
  c.bind(VerifyMfaLoginUseCase).toSelf();
  c.bind(ChangePasswordUseCase).toSelf();
  c.bind(RefreshSessionUseCase).toSelf();
  c.bind(LogoutUseCase).toSelf();
  c.bind(AutocompleteSearchUseCase).toSelf();
  c.bind(SuggestPlacesUseCase).toSelf();
  c.bind(AiAssistUseCase).toSelf();
  c.bind(ListRewardPartnersUseCase).toSelf();
  c.bind(UpdateRewardsProfileUseCase).toSelf();
  c.bind(BumpItemUseCase).toSelf();
  c.bind(CreateItemUseCase).toSelf();
  c.bind(GetItemUseCase).toSelf();
  c.bind(ListItemsUseCase).toSelf();
  c.bind(UpdateItemUseCase).toSelf();
  c.bind(DetectDuplicateItemUseCase).toSelf();
  c.bind(ClearItemReviewFlagUseCase).toSelf();
  c.bind(ListFlaggedItemsUseCase).toSelf();
  c.bind(ListMatchesForItemUseCase).toSelf();
  c.bind(AcceptMatchUseCase).toSelf();
  c.bind(RejectMatchUseCase).toSelf();
  c.bind(ConfirmItemReturnUseCase).toSelf();
  c.bind(PostMessageUseCase).toSelf();
  c.bind(ListThreadsUseCase).toSelf();
  c.bind(GetMessagesUseCase).toSelf();
  c.bind(MarkMessageReadUseCase).toSelf();
  c.bind(SendTypingUseCase).toSelf();
  c.bind(ReleaseRewardUseCase).toSelf();
  c.bind(GenerateUploadSignatureUseCase).toSelf();

  c.bind(MintQrTagsUseCase).toSelf();
  c.bind(ClaimQrTagUseCase).toSelf();
  c.bind(GetTagByCodeUseCase).toSelf();
  c.bind(ScanQrTagUseCase).toSelf();
  c.bind(RecordTagHeartbeatUseCase).toSelf();
  c.bind(MarkTagLostUseCase).toSelf();
  c.bind(ListMyTagsUseCase).toSelf();
  c.bind(CrowdsourcedHeartbeatUseCase).toSelf();
  c.bind(ListQrTagProductsUseCase).toSelf();
  c.bind(CreateQrTagOrderUseCase).toSelf();
  c.bind(FulfilQrTagOrderUseCase).toSelf();
  c.bind(PayForQrTagOrderUseCase).toSelf();
  c.bind(HandlePaystackWebhookUseCase).toSelf();
  c.bind(ListMyQrTagOrdersUseCase).toSelf();

  c.bind(GetVerificationQuestionsUseCase).toSelf();
  c.bind(SubmitVerificationUseCase).toSelf();
  c.bind(DecideVerificationUseCase).toSelf();
  c.bind(ListPendingVerificationsUseCase).toSelf();

  c.bind(RequestCourierJobUseCase).toSelf();
  c.bind(AcceptCourierJobUseCase).toSelf();
  c.bind(TransitionCourierJobUseCase).toSelf();
  c.bind(ListOpenCourierJobsUseCase).toSelf();
  c.bind(ListNearbyCourierJobsUseCase).toSelf();
  c.bind(CalculateRouteUseCase).toSelf();
  c.bind(GetCourierJobUseCase).toSelf();
  c.bind(ListMyCourierJobsUseCase).toSelf();

  c.bind(CreateVaultEntryUseCase).toSelf();
  c.bind(ListVaultEntriesUseCase).toSelf();
  c.bind(DeleteVaultEntryUseCase).toSelf();

  c.bind(CreateZoneSubscriptionUseCase).toSelf();
  c.bind(ListMyZoneSubscriptionsUseCase).toSelf();
  c.bind(DeleteZoneSubscriptionUseCase).toSelf();

  c.bind(ListUnclaimedAsAuctionUseCase).toSelf();
  c.bind(PlaceBidUseCase).toSelf();
  c.bind(ListLiveMarketplaceUseCase).toSelf();
  c.bind(ListMyBidsUseCase).toSelf();
  c.bind(GetMarketplaceListingUseCase).toSelf();
  c.bind(SettleMarketplaceAuctionUseCase).toSelf();

  c.bind(GenerateStolenItemReportUseCase).toSelf();
  c.bind(FilePoliceCaseUseCase).toSelf();

  c.bind(OnboardInstitutionUseCase).toSelf();
  c.bind(ListInstitutionsUseCase).toSelf();
  c.bind(GetInstitutionUseCase).toSelf();
  c.bind(SubscribeInstitutionUseCase).toSelf();
  c.bind(SubmitInstitutionLeadUseCase).toSelf();
  c.bind(ListInstitutionLeadsUseCase).toSelf();
  c.bind(DecideInstitutionLeadUseCase).toSelf();
  c.bind(CreateRedemptionUseCase).toSelf();
  c.bind(ListMyRedemptionsUseCase).toSelf();
  c.bind(ListInstitutionRedemptionsUseCase).toSelf();
  c.bind(ConfirmRedemptionUseCase).toSelf();

  c.bind(GetLeaderboardUseCase).toSelf();
  c.bind(GetShareCardUseCase).toSelf();
  c.bind(DescribeImageUseCase).toSelf();
  c.bind(HandleInboundSmsUseCase).toSelf();

  c.bind(WriteAuditLogUseCase).toSelf();
  c.bind(ListAuditLogsUseCase).toSelf();

  c.bind(RegisterPushTokenUseCase).toSelf();
  c.bind(SetLocaleUseCase).toSelf();
  c.bind(UpdateProfileUseCase).toSelf();
  c.bind(RedeemPointsUseCase).toSelf();
  c.bind(ExportMyDataUseCase).toSelf();

  c.bind(ComprehensiveExportUseCase).toSelf();
  c.bind(DeleteAccountUseCase).toSelf();

  c.bind(RequestPhoneOtpUseCase).toSelf();
  c.bind(VerifyPhoneOtpUseCase).toSelf();
  c.bind(RequestEmailVerificationUseCase).toSelf();
  c.bind(ConfirmEmailVerificationUseCase).toSelf();
  c.bind(RequestPasswordResetUseCase).toSelf();
  c.bind(ConfirmPasswordResetUseCase).toSelf();

  c.bind(BlockUserUseCase).toSelf();
  c.bind(UnblockUserUseCase).toSelf();
  c.bind(ListBlocksUseCase).toSelf();
  c.bind(FileReportUseCase).toSelf();
  c.bind(DecideReportUseCase).toSelf();
  c.bind(ListOpenReportsUseCase).toSelf();

  c.bind(ListModerationQueueUseCase).toSelf();
  c.bind(ReviewModerationItemUseCase).toSelf();

  c.bind(GetAdminStatsUseCase).toSelf();
  c.bind(GetPartnerStatsUseCase).toSelf();

  c.bind(ListUsersUseCase).toSelf();
  c.bind(UpdateUserStatusUseCase).toSelf();
  c.bind(UpdateUserRolesUseCase).toSelf();

  c.bind(ListNotificationsUseCase).toSelf();
  c.bind(MarkNotificationReadUseCase).toSelf();
  c.bind(MarkAllNotificationsReadUseCase).toSelf();
  c.bind(CountUnreadNotificationsUseCase).toSelf();
  c.bind(CreateNotificationUseCase).toSelf();

  c.bind(CreateWebhookUseCase).toSelf();
  c.bind(ListWebhooksUseCase).toSelf();
  c.bind(UpdateWebhookUseCase).toSelf();
  c.bind(DeleteWebhookUseCase).toSelf();
  c.bind(DeliverWebhookUseCase).toSelf();

  c.bind(ApplyTrustedFinderUseCase).toSelf();
  c.bind(ListTrustedFinderApplicationsUseCase).toSelf();
  c.bind(DecideTrustedFinderApplicationUseCase).toSelf();

  c.bind(BookmarkItemUseCase).toSelf();
  c.bind(UnbookmarkItemUseCase).toSelf();
  c.bind(ListMyBookmarksUseCase).toSelf();

  c.bind(ListPartnerItemsUseCase).toSelf();
  c.bind(GetPartnerItemUseCase).toSelf();
  c.bind(CreatePartnerItemUseCase).toSelf();
  c.bind(UpdatePartnerItemStatusUseCase).toSelf();
  c.bind(CreatePartnerApiKeyUseCase).toSelf();
  c.bind(ListPartnerApiKeysUseCase).toSelf();
  c.bind(RevokePartnerApiKeyUseCase).toSelf();

  c.bind(CreateReviewUseCase).toSelf();
  c.bind(ListReviewsForUserUseCase).toSelf();
  c.bind(GetMyReviewForMatchUseCase).toSelf();

  c.bind(GetFeatureFlagsUseCase).toSelf();
  c.bind(IsFeatureEnabledUseCase).toSelf();
  c.bind(ToggleFeatureFlagUseCase).toSelf();
  c.bind(UpdateRolloutUseCase).toSelf();
  c.bind(SeedFeatureFlagsUseCase).toSelf();

  return c;
}
