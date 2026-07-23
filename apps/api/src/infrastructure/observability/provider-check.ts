import type { IErrorReporter, ILogger } from '../../application/ports/services.js';
import type { Env } from '../../config/env.js';

interface ProviderCheck {
  key: string;
  present: boolean;
  /** Critical providers degrade core flows when absent in production. */
  critical: boolean;
}

/**
 * On boot, surface any missing provider keys. In production, critical gaps are
 * logged at ERROR and reported to the error tracker so they are not silently
 * swallowed (the adapters no-op when keys are absent).
 *
 * If any critical key is missing in production the function throws to fail fast.
 */
export function checkCriticalProviders(
  env: Env,
  logger: ILogger,
  reporter: IErrorReporter,
): void {
  const checks: ProviderCheck[] = [
    { key: 'MONGO_URI', present: !!env.MONGO_URI, critical: true },
    { key: 'REDIS_URL', present: !!env.REDIS_URL, critical: true },
    { key: 'RESEND_API_KEY', present: !!env.RESEND_API_KEY, critical: true },
    { key: 'ANTHROPIC_API_KEY', present: !!env.ANTHROPIC_API_KEY, critical: true },
    { key: 'TWILIO_ACCOUNT_SID', present: !!env.TWILIO_ACCOUNT_SID, critical: true },
    { key: 'TWILIO_AUTH_TOKEN', present: !!env.TWILIO_AUTH_TOKEN, critical: true },
    { key: 'TWILIO_FROM_NUMBER', present: !!env.TWILIO_FROM_NUMBER, critical: true },
    { key: 'CLOUDINARY_API_KEY', present: !!env.CLOUDINARY_API_KEY, critical: true },
    { key: 'CLOUDINARY_API_SECRET', present: !!env.CLOUDINARY_API_SECRET, critical: true },
    { key: 'VAPID_PRIVATE_KEY', present: !!env.VAPID_PRIVATE_KEY, critical: false },
    { key: 'HUBTEL_CLIENT_SECRET', present: !!env.HUBTEL_CLIENT_SECRET, critical: false },
    { key: 'MAPBOX_TOKEN', present: !!env.MAPBOX_TOKEN, critical: false },
    { key: 'SENTRY_DSN', present: !!env.SENTRY_DSN, critical: false },
  ];

  const isProd = env.NODE_ENV === 'production';
  const missing = checks.filter((c) => !c.present);

  for (const m of missing) {
    if (isProd && m.critical) {
      logger.error(`Critical provider key missing: ${m.key} — feature will be degraded in production`, {
        key: m.key,
      });
    } else {
      logger.warn(`Provider key not configured: ${m.key}`, { key: m.key });
    }
  }

  const criticalMissing = missing.filter((m) => m.critical).map((m) => m.key);
  if (isProd && criticalMissing.length > 0) {
    const msg = `Critical provider keys missing in production: ${criticalMissing.join(', ')}`;
    reporter.report(new Error(msg), { keys: criticalMissing });
    throw new Error(`Missing critical configuration: ${criticalMissing.join(', ')}`);
  }
}
