# Back2u — Smart Lost & Found Ecosystem

AI-powered platform that reunites people with their lost belongings. Built as a TypeScript monorepo with a hexagonal-architecture Express backend, four React + MUI web apps, and an Expo mobile app.

## CI / CD

Every push and PR runs `.github/workflows/ci.yml`:

| Stage | What runs |
| --- | --- |
| Lint + typecheck | `pnpm typecheck` across the workspace |
| Unit tests | Pure-domain entity specs (`pnpm --filter @back2u/api test:unit`) |
| Integration tests | Use-case suite against `mongodb-memory-server` |
| HTTP smoke | Supertest against `buildApp(buildContainer())` |
| Build | `pnpm build` (turbo, all apps) |
| Docker (main only) | `docker buildx` of the API image to verify the Dockerfile |

`.github/workflows/deploy.yml` runs on `main`:

- Triggers Render's API + worker deploy hooks (`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_WORKER` secrets)
- Builds + uploads static bundles (website / client-web / admin / partner) — wire to your static host of choice
- Pushes an EAS update for the Expo mobile app (gated on `EXPO_TOKEN` secret)

Other workflows:

- `e2e.yml` — Playwright smoke against the web app, scheduled daily 06:00 UTC
- `codeql.yml` — security scan on push, PR, and weekly schedule
- `dependabot.yml` — weekly npm + Actions + Docker bumps, grouped by minor/patch

## Local dev with Docker

```bash
docker compose up           # mongo + redis + api + worker
docker compose run --rm api pnpm migrate
```

## Conventions

- **Conventional Commits** enforced by `commitlint` on `commit-msg`
- **lint-staged + Prettier** runs on `pre-commit`
- **Husky** scripts live in `.husky/` — installed by `pnpm install` (via `prepare`)
- **CODEOWNERS** can be added to `.github/CODEOWNERS` when you want PR review gating

## Quick start (no provider keys needed)

Dev secrets (VAPID, vault, JWT) are already generated in `.env` so the app boots offline. Provider keys can stay blank — adapters fall back gracefully (emails are logged instead of sent, AI returns empty embeddings, escrow is a no-op, etc.). Add real keys provider-by-provider as you sign up.

```bash
pnpm install
brew services start mongodb-community  # or: docker run -p 27017:27017 mongo
brew services start redis               # or: docker run -p 6379:6379 redis
pnpm --filter @back2u/api migrate
pnpm dev                                 # api + 4 web apps
pnpm --filter @back2u/api dev:worker     # bullmq worker (separate terminal)
pnpm --filter @back2u/client-mobile dev  # expo
```

Rotate secrets at any time: `./scripts/setup-keys.sh > .env.secrets`.

## Provisioning checklist

Add the keys to `.env` (and to Render Dashboard → Environment for production). Each row tells you which features stay disabled until the key is set.

| Provider | Free tier | Sign up | Env keys | Disables when blank |
| --- | --- | --- | --- | --- |
| **MongoDB Atlas** | 512 MB | [cloud.mongodb.com](https://cloud.mongodb.com) | `MONGO_URI` | Required — app won't boot |
| **Redis** | Render free 25 MB | Render dashboard add-on | `REDIS_URL` | Match generation falls back to in-process (single instance only) |
| **OpenAI** | Pay-as-you-go | [platform.openai.com](https://platform.openai.com) | `OPENAI_API_KEY` | AI matching, AI describe, AI verification, moderation |
| **Cloudinary** | 25 credits/mo | [cloudinary.com](https://cloudinary.com) | `CLOUDINARY_*` (3 keys) | Image uploads, signed PDF storage |
| **Resend** | 3k emails/mo | [resend.com](https://resend.com) | `RESEND_API_KEY`, `RESEND_FROM` | Welcome / match / chat / reset emails |
| **Mapbox** | 50k loads/mo | [account.mapbox.com](https://account.mapbox.com) | `MAPBOX_TOKEN`, `VITE_MAPBOX_TOKEN`, `EXPO_PUBLIC_MAPBOX_TOKEN` | Map page, geocoding |
| **Twilio** | $15 trial credit | [twilio.com](https://twilio.com) | `TWILIO_*` (3 keys) | Phone OTP, SMS fallback, inbound SMS |
| **Hubtel** | Per-transaction | [hubtel.com](https://hubtel.com) | `HUBTEL_*` (3 keys) | Mobile-money escrow (reward hold/release) |
| **Expo push** | Free | EAS dashboard | `EXPO_ACCESS_TOKEN` | Push notifications to mobile devices |
| **Sentry** | 5k events/mo | [sentry.io](https://sentry.io) | `SENTRY_DSN` | Production error reporting (logger fallback in dev) |

Generate dev secrets locally:

```bash
./scripts/setup-keys.sh   # prints VAPID, vault, JWT secrets to stdout
```

## Web ↔ Mobile parity

| Feature                                 | Backend | Web | Mobile |
| --------------------------------------- | :-----: | :-: | :----: |
| Register / Login / Logout                | ✓ | ✓ | ✓ |
| Forgot / reset password                  | ✓ | ✓ | ✓ |
| Email verification                       | ✓ | ✓ | ✓ |
| Phone OTP                                | ✓ | ✓ | ✓ |
| Comprehensive GDPR export                | ✓ | ✓ | ✓ |
| Account deletion (anonymise)             | ✓ | ✓ | ✓ |
| Feed / Item / Post / Matches / Chat      | ✓ | ✓ | ✓ |
| AI describe (1-tap autofill)             | ✓ | ✓ | hookable |
| QR tags (claim / lost / list)            | ✓ | ✓ | ✓ |
| QR tag scan (camera)                     | ✓ | n/a | ✓ |
| Memory vault (encrypted at rest)         | ✓ | ✓ | ✓ |
| Marketplace + bidding                    | ✓ | ✓ | ✓ |
| Leaderboard + badges                     | ✓ | ✓ | ✓ |
| Map / hotspots                           | ✓ | ✓ (Mapbox) | ✓ (list) |
| Courier (request + open jobs)            | ✓ | ✓ | ✓ |
| Verification flow                        | ✓ | ✓ | ✓ |
| Settings (locale + redeem + privacy)     | ✓ | ✓ | ✓ |
| Block / report safety                    | ✓ | ✓ | ✓ |
| Zone subscriptions (polygon)             | ✓ | ✓ | ✓ |
| Police-case PDF                          | ✓ | ✓ | ✓ |
| Share card                               | ✓ | ✓ | ✓ |
| Web push subscribe (browser)             | ✓ | ✓ | n/a |
| Expo push token (auto on login)          | ✓ | n/a | ✓ |

## Production-readiness status

**In place (Tier 1 — security/correctness/compliance):**
- Argon2id passwords, JWT access tokens, server-stored rotating refresh tokens with revocation + logout
- Phone OTP, email verification, password reset (issue+confirm), comprehensive GDPR data export, account deletion with PII anonymisation
- Idempotency middleware on all mutating routes (`Idempotency-Key` header, 24h replay-safe)
- Audit log writes on privileged actions (reward release, match accept/reject, more easy to extend)
- Twilio webhook signature verification (HMAC-SHA1)
- Chat gated on verification approval; PII redaction (phone/email/URL); per-user blocklist enforced
- Money in integer minor units (pesewa); reward `hold` at item creation, `release` on confirmed return
- CSP via Helmet; CORS allowlist + preview-domain regex; rate limiting per IP
- Health endpoint reflects Mongo readyState; graceful shutdown closes scheduler+http+mongo
- Background scheduler: marketplace auto-close at `closesAt`, items auto-archive after 60 days
- Block / report / decide-report flows with admin queue
- Vitest baseline specs for `Match`, `Otp`, `Money`, `RefreshToken`

**Tier 2 (operations) — now in place:**

- **BullMQ** queue for background work (match generation) — `apps/api/src/infrastructure/queue/`
- **Worker process** (`pnpm start:worker`) deployed as a separate Render service via `render.yaml`
- **Sentry** wired into `IErrorReporter` — auto-detected via `SENTRY_DSN`
- **PDF reports** rendered by `pdfkit`, uploaded to Cloudinary
- **Vault encryption** with libsodium XChaCha20-Poly1305 + per-user AAD; sensitive fields redacted on write, decrypted on read
- **Web push** end-to-end: VAPID keys, subscriptions repo, `/v1/web-push/{key,subscribe,unsubscribe}`, service worker at `apps/client-web/public/sw.js`
- **OpenAPI** spec at `/v1/openapi.json`, Swagger UI at `/v1/docs`, dump CLI: `pnpm --filter @back2u/api openapi:dump`
- **Mongo migrations**: index sync on every boot via `ensureIndexes()`, plus a versioned migration ledger (`_back2u_migrations`) for destructive changes; CLI: `pnpm --filter @back2u/api migrate`
- **Playwright** baseline E2E for client-web (`pnpm --filter @back2u/client-web test:e2e`)

**Decisions baked in (swap via single container binding):**

| Concern         | Default                                       | Swap path |
| --------------- | --------------------------------------------- | --------- |
| Queue           | BullMQ + Redis                                 | `IQueue` / `IQueueWorker` bindings |
| Vault crypto    | libsodium with `VAULT_MASTER_KEY`              | `IVaultCipher` (KMS-ready) |
| PDF             | pdfkit in-process                              | `IPdfReportService` |
| Error reporting | Sentry (`SENTRY_DSN`) → falls back to logger   | `IErrorReporter` |
| Visual matching | OpenAI gpt-4o-mini                              | `IAiMatchingService` |
| Web push        | `web-push` + VAPID                              | `IWebPushService` |

## Feature set

### From the original spec
- AI-powered matching (visual + text + geo + time)
- Geo-fenced lost zones with hotspot map
- Proof-of-ownership verification with AI consistency scoring + admin review
- Reward + points + leaderboard + badges (`hero_finder`, `trusted_guardian`, `trusted_finder`)
- QR code tag ecosystem (mint, claim, anonymous scan, owner alert)
- Anonymous chat with auto-moderation + scam detection
- Institutional integration (school/airport/transport/event/mall) with API keys + webhooks
- "Found it near you" map view
- Courier recovery jobs with pickup/delivery 6-digit codes
- Theft vs lost classification → escalated stolen flow
- Memory Vault for receipts, serial numbers, IMEI, photos
- Social share cards (`Help me find this`)
- Marketplace for unclaimed items (auction with bids, charity donation)
- AI description generator from a photo
- Trusted Finder Network (auto-promoted at 10 successful returns)

### Research-driven additions
- Bluetooth/NFC heartbeat — crowdsourced "last seen" pings via `/v1/tags/heartbeat`
- SMS + WhatsApp fallback (Twilio inbound parser at `/v1/sms/inbound`)
- Mobile-money escrow (Hubtel adapter) — held on reward creation, released on confirmed return
- Police case integration — generate stolen-item PDF, file with case number/station
- Perceptual hash duplicate detection on every upload
- Public lost-board endpoint for embeddable institution widgets
- Multi-language (English, French, Twi, Ga, Ewe) — server-side i18n bundle
- Neighborhood watch — polygon zone subscriptions with push/email/sms fan-out
- Push notifications via Expo
- GDPR data export + audit log

## Stack

| Layer        | Tech                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| Backend      | Node 20 + Express 5, TypeScript, Inversify (DI), Mongoose 8, Zod, Socket.IO      |
| Domain shape | Hexagonal architecture (domain → application/ports → infrastructure → interfaces) |
| Auth         | Email + password (Argon2id) → JWT access + refresh; phone OTP via Twilio         |
| Storage      | MongoDB (geo + text + 2dsphere on tags/zones), Cloudinary (images, signed)       |
| AI           | OpenAI `text-embedding-3-large` + `gpt-4o-mini` vision + moderation + verification |
| Email        | Resend                                                                           |
| SMS          | Twilio                                                                           |
| Payments     | Hubtel mobile-money escrow                                                       |
| Push         | Expo push                                                                        |
| Maps/geocode | Mapbox                                                                           |
| Realtime     | Socket.IO (chat + match + courier + tag-scan + zone alerts)                      |
| Frontends    | React 18 + Vite + MUI 6 + TanStack Query + Zustand + react-router                |
| Mobile       | Expo SDK 52 + expo-router + react-native-paper                                   |
| Monorepo     | pnpm workspaces + Turborepo                                                      |
| Deploy       | API → Render (Docker). Web apps → any static host. Mobile → EAS.                 |

## Repo layout

```
back2u/
├── apps/
│   ├── api/            # Express + hexagonal architecture (Render)
│   ├── client-web/     # End-user web app — port 5173
│   ├── admin/          # Super-admin dashboard — port 5174
│   ├── partner/        # Institution partner portal — port 5175
│   ├── website/        # Marketing/landing — port 5176
│   └── client-mobile/  # Expo app
├── packages/
│   ├── shared-types/   # DTOs, enums shared by API + frontends
│   ├── api-client/     # Typed fetch client (Back2uClient)
│   ├── ui-web/         # Shared MUI theme + AppShell + BrandLogo
│   └── config/         # tsconfig + eslint presets
├── render.yaml
├── turbo.json
└── pnpm-workspace.yaml
```

### Hexagonal layout (apps/api/src)

```
domain/
  item, user, match, chat (thread+message), reward,
  tag, verification, courier, vault, audit,
  subscription (zones), marketplace_listing, announcement (police),
  institution, shared (id, errors, value-objects)
application/
  ports/        — IItemRepository, IEmailService, IAiMatchingService,
                  ISmsService, IPaymentEscrowService, IPushService,
                  IPerceptualHashService, IPdfReportService, II18nService,
                  IAiVerificationService, …
  use-cases/    — ~40 use cases, one class each
infrastructure/
  persistence/mongo/  — Mongoose models + repositories
  email/resend, sms/twilio, payments/momo (Hubtel), push (Expo),
  ai/openai, maps/mapbox, perceptual_hash, i18n, security, realtime,
  storage/cloudinary (images + PDF reports)
interfaces/http/      — Express routes, middleware, validators
composition/          — Inversify container wiring
```

## API surface (v1)

```
auth/        register, login, refresh, me
me/          push-token, locale, redeem, export, ai/describe-image
items/       list, get, create, update, list-matches
matches/     accept, reject
chat/        threads, messages, post
rewards/     release
uploads/     signature
tags/        mine, mint (admin), claim, scan, heartbeat, lost
verifications/  questions, submit, decide (admin), pending (admin)
courier/     jobs (request), jobs/open (rider), accept, transition
vault/       list, create, delete
zones/       list, create, delete (polygon subscriptions)
marketplace/ list, create (admin), bids
police/      items/:id/report, cases/:id/file
institutions/list, get, create (admin)
leaderboard/ top users
share/       items/:id/share-card
sms/         inbound (Twilio webhook)
audit/       list (admin)
```

Every response is `{ data: T }`; errors are `{ error: { code, message, details? } }`.

## How AI matching works

1. On `POST /v1/items` we compute a `text-embedding-3-large` vector from `title + description + tags`, plus an "image embedding" via vision-described text.
2. Compute a perceptual content hash on the first image; if it's near-identical to an existing one, mark `duplicateOfId`.
3. Background `GenerateMatchesUseCase` finds opposite-kind items (lost↔found) within 5 km / 14 days using Mongo `$near` (2dsphere).
4. Score: `0.4·cos(image) + 0.3·cos(text) + 0.2·geo + 0.1·time`. ≥ 0.55 → `Match` row.
5. Both posters get a Resend email + Expo push + a `match:new` Socket.IO event.
6. Anyone subscribed to a zone polygon containing the report point is alerted on their channel(s).

## First-time setup

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Run everything
pnpm dev
```

## Common commands

```bash
pnpm dev                                    # turbo dev across all apps
pnpm --filter @back2u/api dev               # API only
pnpm --filter @back2u/client-web dev
pnpm --filter @back2u/client-mobile dev     # Expo
pnpm build
pnpm typecheck
```

## Deploy

- **API → Render**: connect this repo, Render reads `render.yaml`. Provision MongoDB Atlas separately and paste `MONGO_URI` as a secret. Set the other secrets (OpenAI, Cloudinary, Resend, Mapbox, Twilio, Hubtel, Expo).
- **Web apps → Netlify / Vercel / Cloudflare Pages**: each app builds with `pnpm --filter @back2u/<app> build`, output in `dist/`.
- **Mobile → EAS**: `cd apps/client-mobile && eas build --platform ios|android`.
