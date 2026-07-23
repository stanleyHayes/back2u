import cors, { type CorsOptionsDelegate } from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { Redis } from 'ioredis';
import type { Container } from 'inversify';
import { pinoHttp } from 'pino-http';

import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';
import { PinoAppLogger } from '../../infrastructure/security/pino-logger.js';
import { accountRouter } from './routes/account.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { authExtraRouter } from './routes/auth-extra.routes.js';
import { bookmarkRouter } from './routes/bookmark.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { courierRouter } from './routes/courier.routes.js';
import { geoRouter } from './routes/geo.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { institutionsRouter } from './routes/institutions.routes.js';
import { itemsRouter } from './routes/items.routes.js';
import { leaderboardRouter } from './routes/leaderboard.routes.js';
import { marketplaceRouter } from './routes/marketplace.routes.js';
import { matchesRouter } from './routes/matches.routes.js';
import { meExtrasRouter } from './routes/me-extras.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { redemptionsRouter } from './routes/redemptions.routes.js';
import { policeRouter } from './routes/police.routes.js';
import { rewardsRouter } from './routes/rewards.routes.js';
import { safetyRouter } from './routes/safety.routes.js';
import { moderationRouter } from './routes/moderation.routes.js';
import { shareRouter } from './routes/share.routes.js';
import { smsRouter } from './routes/sms.routes.js';
import { tagsRouter } from './routes/tags.routes.js';
import { uploadsRouter } from './routes/uploads.routes.js';
import { vaultRouter } from './routes/vault.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { partnerRouter } from './routes/partner.routes.js';
import { partnerApiRouter } from './routes/partner-api.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { verificationRouter } from './routes/verification.routes.js';
import { webhooksRouter } from './routes/webhooks.routes.js';
import { zonesRouter } from './routes/zones.routes.js';
import { openApiRouter } from './routes/openapi.routes.js';
import { webPushRouter } from './routes/web-push.routes.js';
import { trustedFinderRouter } from './routes/trusted-finder.routes.js';
import { featureFlagRouter } from './routes/feature-flag.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import { swaggerUiAssets, swaggerUiHandler, swaggerJsonHandler } from './swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { idempotency } from './middleware/idempotency.js';
import { authLimiter, publicLimiter, strictLimiter, partnerApiLimiter } from './middleware/rate-limit.js';
import { tracingMiddleware } from './middleware/tracing.js';
import { performanceMiddleware, getMetrics } from './middleware/performance.js';
import { requireVerifiedEmail } from './middleware/require-verified.js';
import { uploadLimit, messageRateLimit } from './middleware/abuse-limits.js';

export function buildApp(c: Container): Express {
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }) : null;

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'https:', 'wss:'],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowList = env.CORS_ORIGINS.split(',').map((s) => s.trim());
  // Anchor the pattern: an unanchored env regex would match (and credential)
  // any origin that merely contains the pattern as a substring.
  const previewRegex = env.CORS_PREVIEW_REGEX ? new RegExp(`^(?:${env.CORS_PREVIEW_REGEX})$`) : null;
  const corsDelegate: CorsOptionsDelegate = (req, cb) => {
    const origin = req.headers.origin;
    if (!origin) return cb(null, { origin: false });
    if (allowList.includes(origin) || (previewRegex && previewRegex.test(origin))) {
      return cb(null, { origin: true, credentials: true });
    }
    cb(null, { origin: false });
  };
  app.use(cors(corsDelegate));

  app.use(tracingMiddleware);
  app.use(performanceMiddleware);
  app.use(express.json({ limit: '4mb' }));
  app.use(pinoHttp({ logger: logger.raw }));
  app.use(idempotency(c));

  app.use('/health', healthRouter(redis));
  // Internal metrics are sensitive: only serve them to loopback clients;
  // anything else falls through to the standard 404 handler.
  const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
  app.get('/health/metrics', (req, res, next) => {
    if (!req.ip || !LOOPBACK_IPS.has(req.ip)) return next();
    res.json({ metrics: getMetrics(), generatedAt: new Date().toISOString() });
  });
  app.use('/v1/auth', authLimiter(redis), authRouter(c));
  app.use('/v1/auth', authLimiter(redis), authExtraRouter(c, `${env.API_PUBLIC_URL}/reset-password`));
  app.use('/v1/me', strictLimiter(redis), meExtrasRouter(c));
  app.use('/v1/account', strictLimiter(redis), accountRouter(c));
  app.use('/v1/items', publicLimiter(redis), itemsRouter(c));
  app.use('/v1/geo', strictLimiter(redis), geoRouter(c));
  app.use('/v1/bookmarks', strictLimiter(redis), bookmarkRouter(c));
  app.use('/v1/uploads', strictLimiter(redis), uploadLimit(c), uploadsRouter(c));
  app.use('/v1/matches', strictLimiter(redis), matchesRouter(c));
  app.use('/v1/chat', strictLimiter(redis), messageRateLimit(c), chatRouter(c));
  app.use('/v1/rewards', strictLimiter(redis), rewardsRouter(c));
  // uploads handled above with abuse limit
  app.use('/v1/tags', publicLimiter(redis), tagsRouter(c));
  app.use('/v1/verifications', strictLimiter(redis), verificationRouter(c));
  app.use('/v1/courier', strictLimiter(redis), courierRouter(c));
  app.use('/v1/vault', strictLimiter(redis), vaultRouter(c));
  app.use('/v1/zones', strictLimiter(redis), zonesRouter(c));
  app.use('/v1/marketplace', publicLimiter(redis), marketplaceRouter(c));
  app.use('/v1/police', strictLimiter(redis), policeRouter(c));
  app.use('/v1/institutions', publicLimiter(redis), institutionsRouter(c));
  app.use('/v1/leaderboard', publicLimiter(redis), leaderboardRouter(c));
  app.use('/v1/share', strictLimiter(redis), shareRouter(c, env.API_PUBLIC_URL));
  app.use('/v1/sms', strictLimiter(redis), smsRouter(c));
  app.use('/v1/users', strictLimiter(redis), usersRouter(c));
  app.use('/v1/admin', strictLimiter(redis), adminRouter(c));
  app.use('/v1/partner', strictLimiter(redis), partnerRouter(c));
  app.use('/partner/v1', partnerApiLimiter(redis), partnerApiRouter(c, redis));
  app.use('/v1/audit', strictLimiter(redis), auditRouter(c));
  app.use('/v1/safety', strictLimiter(redis), safetyRouter(c));
  app.use('/v1/moderation', strictLimiter(redis), moderationRouter(c));
  app.use('/v1/web-push', strictLimiter(redis), webPushRouter(c));
  app.use('/v1/notifications', strictLimiter(redis), notificationRouter(c));
  app.use('/v1/webhooks', strictLimiter(redis), webhooksRouter(c));
  app.use('/v1/redemptions', strictLimiter(redis), redemptionsRouter(c));
  app.use('/v1/trusted-finder', strictLimiter(redis), trustedFinderRouter(c));
  app.use('/v1/reviews', strictLimiter(redis), reviewRouter(c));
  app.use('/v1/features', strictLimiter(redis), featureFlagRouter(c));
  app.use('/v1', openApiRouter());

  app.get('/docs.json', swaggerJsonHandler);
  app.use('/docs', swaggerUiAssets(), swaggerUiHandler());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
