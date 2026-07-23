import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  // Public base URL of the user-facing web app; used to build links in
  // emails, SMS, and push notifications. Override per environment / white-label.
  APP_PUBLIC_URL: z.string().url().default('https://back2u.app'),

  MONGO_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default('Back2u <no-reply@back2u.app>'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  MAPBOX_TOKEN: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  HUBTEL_CLIENT_ID: z.string().optional(),
  HUBTEL_CLIENT_SECRET: z.string().optional(),
  HUBTEL_MERCHANT_ACCOUNT: z.string().optional(),

  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  // Platform commission taken from a reward when it is released to the finder (0–1).
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.1),

  EXPO_ACCESS_TOKEN: z.string().optional(),

  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:no-reply@back2u.app'),
  SENTRY_DSN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  VAULT_MASTER_KEY: z.string().optional(),

  REQUIRE_VERIFIED_EMAIL: z.coerce.boolean().default(false),
  UPLOAD_DAILY_LIMIT: z.coerce.number().default(10),
  MESSAGE_RATE_LIMIT: z.coerce.number().default(30),

  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176',
    ),
  CORS_PREVIEW_REGEX: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
