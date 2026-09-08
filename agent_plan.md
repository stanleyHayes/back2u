# bak2me Audit, Bug Fixes & Growth Plan

> Date: 2026-05-28
> Scope: `apps/website` audit, monorepo bug fixes, feature completion, and commercial growth recommendations.

---

## 1. Executive Summary

bak2me is a sophisticated AI-powered lost & found ecosystem with a hexagonal-architecture Express backend, four React web apps, and an Expo mobile app. The product is **functionally rich** (19+ client-web pages, AI matching, geo-fencing, courier, marketplace, QR tags, vault, etc.) but the **marketing website was critically under-built** and the **monorepo had significant type-system debt** that blocked builds and CI.

This plan documents:

- **Audit findings** (bugs, missing features, SEO/accessibility gaps)
- **Bug fixes applied**
- **Features completed**
- **High-ROI feature suggestions** to make bak2me sell

---

## 2. Website Audit Findings

### 2.1 Critical Bugs (Pre-Fix)

| Issue               | Severity  | Detail                                                                                                                                      |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure       | 🔴 High   | Committed compiled artifacts (`src/App.js`, `src/main.js`) contained raw JSX; Vite tried to bundle them and crashed with "JSX not enabled". |
| Broken import       | 🟡 Medium | `main.tsx` imported `./App.js` instead of `./App`.                                                                                          |
| Missing type anchor | 🟡 Medium | No `src/vite-env.d.ts` for `import.meta.env` typing.                                                                                        |
| No `lint` script    | 🟡 Medium | Inconsistent tooling vs. `client-web`.                                                                                                      |

### 2.2 SEO Gaps (Pre-Fix)

- No Open Graph / Twitter Card meta tags
- No `theme-color`, `canonical`, `preconnect`, or `robots.txt`
- No `sitemap.xml`
- No JSON-LD structured data
- No favicon links
- All CTAs pointed to the same URL without UTM parameters

### 2.3 Accessibility Gaps

- No `<main>`, `<header>`, `<footer>` landmarks
- No skip-to-content link
- No mobile hamburger menu (buttons wrapped awkwardly)
- Hard-coded English only (app supports 5 locales)

### 2.4 Missing Sales Content

- Zero product screenshots or demo visuals
- No "How it works" story
- No testimonials / social proof
- No FAQ
- No live stats counters
- No partner/institution onboarding CTA
- No newsletter or wait-list capture
- No app store download badges

---

## 3. Monorepo Bug Fixes Applied

### 3.1 Website (`apps/website`)

- **Deleted** committed build artifacts: `src/App.js`, `src/main.js`, `tsconfig.tsbuildinfo`
- **Fixed** `main.tsx` import: `./App.js` → `./App`
- **Added** `src/vite-env.d.ts` for Vite client types
- **Added** `robots.txt` and `sitemap.xml` in `public/`
- **Updated** `index.html` with comprehensive SEO meta tags (OG, Twitter, canonical, preconnect, theme-color)

### 3.2 Shared Packages

| Package                | Fix                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `@back2u/shared-types` | Changed `tsconfig.json` to extend `base.json` instead of `node.json` (removed unnecessary `"types": ["node"]` that required `@types/node`) |
| `@back2u/api-client`   | Same tsconfig fix + rebuilt after `shared-types`                                                                                           |

### 3.3 API (`apps/api`)

| File                                                 | Fix                                                                                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `application/ports/services.ts`                      | Added missing `IErrorReporter` interface (was imported by `server.ts`, `worker.ts`, `error-reporter.ts`, `sentry.reporter.ts`)                                                                       |
| `infrastructure/queue/bullmq.queue.ts`               | Fixed `import IORedis` default-import constructability issue under NodeNext module resolution → `import { Redis } from 'ioredis'`; used local variable to narrow `null` away for `Queue` constructor |
| `infrastructure/queue/bullmq.worker.ts`              | Same ioredis import fix + local variable narrowing                                                                                                                                                   |
| `interfaces/http/app.ts`                             | Fixed `import pinoHttp from 'pino-http'` default-import issue → `import { pinoHttp } from 'pino-http'`                                                                                               |
| `infrastructure/i18n/i18n.service.ts`                | Added null-safety guard for `dict[key]` template resolution                                                                                                                                          |
| `interfaces/http/routes/*.ts` (14 files)             | Fixed Express 5 `req.params.id` typing (`string \| string[]`) by replacing `req.params.id!` with `req.params.id as string`                                                                           |
| `infrastructure/persistence/mongo/repositories/*.ts` | Fixed `null \| undefined` → `string \| undefined` mapping issues for `city`, `country`, `url`, `text` fields                                                                                         |
| `package.json`                                       | Pinned `ioredis` to `5.10.1` to align with `bullmq` dependency                                                                                                                                       |

### 3.4 Client Web (`apps/client-web`)

| File                  | Fix                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/pages/Map.tsx`   | Fixed `react-map-gl/mapbox` import → `react-map-gl` (v7 API)                                           |
| `src/lib/web-push.ts` | Added `as BufferSource` cast for `Uint8Array<ArrayBufferLike>` → `PushManager.subscribe` type mismatch |

### 3.5 Partner (`apps/partner`)

| File           | Fix                                |
| -------------- | ---------------------------------- |
| `package.json` | Added missing `zustand` dependency |

### 3.6 Mobile (`apps/client-mobile`)

| File                                | Fix                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared-types/src/user.ts` | Added missing `successfulReturns?: number` to `UserDTO` (was used in mobile profile screen but absent from shared contract) |

### 3.7 Build Verification

All packages now **typecheck and build cleanly**:

- ✅ `@back2u/website`
- ✅ `@back2u/client-web`
- ✅ `@back2u/api`
- ✅ `@back2u/admin`
- ✅ `@back2u/partner`
- ✅ `@back2u/shared-types`
- ✅ `@back2u/api-client`
- ✅ `@back2u/ui-web`
- ✅ `@back2u/client-mobile`

---

## 4. Website Features Completed

The marketing website was rebuilt from a 2-file skeleton into a **conversion-focused landing page** with the following sections:

### 4.1 Live Stats Banner

- Fetches real counts from public API endpoints (`/v1/items`, `/v1/leaderboard`, `/v1/institutions`)
- Graceful fallback to static social-proof numbers if API is unreachable
- Teal branded banner for visual impact

### 4.2 "How It Works" (3 Steps)

1. **Snap & Post** — 30-second item report
2. **AI Matches** — visual + text + geo + time correlation
3. **Reunite** — verification, anonymous chat, courier pickup

### 4.3 Feature Grid (6 cards)

- Retained original copy but improved visual hierarchy
- Responsive 1→2→3 column layout

### 4.4 Testimonials

- 3 social-proof cards: owner, student, security partner
- Builds trust for a platform handling personal belongings

### 4.5 FAQ Accordion

- 5 high-intent questions: pricing, AI, privacy, QR tags, partnerships
- Reduces objection friction before signup

### 4.6 Final CTA Section

- Branded teal banner with "Get started free" and "Browse items"
- Deep links to `/register` and `/feed`

### 4.7 Footer

- 4-column layout: brand, product links, company links, legal links
- Deep links to app routes (feed, leaderboard, marketplace, institutions, safety)

### 4.8 Responsive Navigation

- Desktop: horizontal nav with "Browse", "Sign in", "Open app"
- Mobile: hamburger menu with collapsible stack

### 4.9 SEO

- Open Graph + Twitter Cards
- Canonical URL
- Font preconnect hints
- `robots.txt` + `sitemap.xml`

---

## 5. Suggested Features to Make bak2me Sell

These are prioritized by **commercial impact / dev effort** ratio.

### 5.1 Immediate (Launch-Blocking for Marketing)

| Feature                          | Why it sells                                                                                       | Effort |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| **Hero demo video / GIF**        | A 10-second loop of "snap → AI match → chat" converts 3× better than text.                         | Low    |
| **Real-time feed embed**         | Embed the public `/v1/items` feed on the landing page so visitors see live activity.               | Low    |
| **App store badges**             | Mobile is critical for "on-the-go" lost & found. Link to App Store / Play Store builds legitimacy. | Low    |
| **Partner logo bar**             | "Trusted by University of Ghana, Accra Mall, Uber…" — even 2–3 logos massively boost conversion.   | Low    |
| **Cookie consent + GDPR banner** | Legal requirement for EU traffic; blocks enterprise deals if missing.                              | Low    |

### 5.2 Short-Term (This Sprint)

| Feature                         | Why it sells                                                                                                                     | Effort |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **QR tag landing page**         | `/tags/:code` should have a beautiful, branded scan page (not just a form). This is a viral loop — every sticker is a billboard. | Medium |
| **Success stories blog**        | SEO content + emotional proof. "How Kofi got his laptop back in 2 hours."                                                        | Medium |
| **Institution onboarding form** | A self-serve "Partner with us" flow (currently requires manual outreach). Capture lead emails, automate approval.                | Medium |
| **Pricing page**                | Clarify free vs. paid (rewards, courier, premium QR tags). Removes hesitation.                                                   | Low    |
| **Push notification demo**      | Let website visitors subscribe to a "demo alert" to feel the geo-fenced notification experience.                                 | Medium |
| **Multi-language landing page** | The app supports `en/fr/tw/ga/ee`. The landing page should too — huge for West African expansion.                                | Medium |

### 5.3 Medium-Term (Next Quarter)

| Feature                          | Why it sells                                                                                                                                                         | Effort |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **White-label for institutions** | Let a university or mall run `findings.university.edu.gh` with their branding. This is the enterprise revenue model.                                                 | High   |
| **Insurance integration**        | Partner with insurers for "report lost item → auto-file claim" workflow. Massive B2B2C value.                                                                        | High   |
| **AI describe-as-you-type**      | In the post form, show AI-generated title/tags while the user uploads the photo. Reduces friction.                                                                   | Medium |
| **Social share cards for items** | When someone shares a lost item on WhatsApp/Twitter, render a rich preview image (`/v1/share/items/:id/share-card`). Already has an endpoint — promote it in the UI. | Low    |
| **Referral program**             | "Invite a friend, both get 50 points." Network effects are everything in marketplace businesses.                                                                     | Medium |
| **Courier tracking page**        | A public tracking URL (like Uber Eats) for courier jobs. Builds trust in the delivery feature.                                                                       | Medium |

### 5.4 Platform Hardening (Required for Scale)

| Feature                          | Why it matters                                                                                                | Effort |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------ |
| **End-to-end integration tests** | Payment flows, matching pipeline, courier state machine need automated coverage before scaling.               | High   |
| **Centralized config for URLs**  | `https://bak2me.com` is hardcoded in 10+ files. Move to env-driven config to support white-label and staging. | Medium |
| **Multi-currency support**       | `GHS` is hardcoded everywhere. Required for expansion beyond Ghana.                                           | Medium |
| **Escrow provider swap**         | Hubtel is Ghana-only. Add Stripe / PayPal / Flutterwave for international rewards.                            | High   |
| **Real map in mobile**           | `client-mobile` map is a flat list. Ship `react-native-maps` + Mapbox for parity with web.                    | Medium |

---

## 6. Technical Debt Register

Items that are not user-facing but block engineering velocity:

1. **Silent service failures** — Email, SMS, push, and escrow all fail silently when provider keys are missing. In production this means dropped OTPs and unpaid rewards. Add circuit breakers and alerting.
2. **Hardcoded currency (`GHS`)** — 15+ occurrences across API and clients.
3. **Hardcoded URLs** — 10+ occurrences of `https://bak2me.com` and `localhost` ports.
4. **In-process scheduler** — `in-process.scheduler.ts` is not crash-safe for horizontal scaling.
5. **Marketplace auto-close** — Only flips a status flag; no winner determination, notification, or settlement.
6. **Missing unsubscribe** — Web push has subscribe but no unsubscribe UI or endpoint wiring.
7. **Profile is read-only** — Users cannot edit name, avatar, or phone in `client-web`.
8. **No delete account flow in mobile** — `client-mobile` settings lacks confirmation dialog for deletion.

---

## 7. Next Steps (Recommended Order)

1. ✅ **Ship the fixed website** (already done)
2. 🎬 **Record a 10-second hero GIF** showing snap → match → chat
3. 📱 **Add App Store / Play Store badges** to website footer + hero
4. 🏷️ **Build the branded QR scan page** (`/tags/:code`) with a viral "Share this tag" CTA
5. 📝 **Publish 3 success-story blog posts** for SEO
6. 🏛️ **Launch self-serve institution onboarding** with email capture
7. 🧪 **Write integration tests** for the matching + reward release pipeline
8. 🌍 **Localize the landing page** into French + Twi

---

## 8. Product Vision Coverage (original brief — "Smart Lost & Found Ecosystem")

Mapping of the 15 features in the founding brief to what is actually built in the monorepo.
Legend: ✅ done · ⚠️ partial · ❌ missing.

| #   | Feature (brief)                                                                               | Status | Where it lives / what's missing                                                                                                        |
| --- | --------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **AI-Powered Matching** (image, text, geo, time; confidence score; auto-notify)               | ✅     | `generate-matches.ts` (visual+text+geo+time, `MIN_SCORE`), `Matches` page, email/push auto-notify                                      |
| 2   | **Geo-Fenced Lost Zones** (map, hotspots, "found near you" alerts)                            | ✅     | `Map` page (Mapbox), `Zones` page + `zone.use-cases`, zone alerts in `create-item`                                                     |
| 3   | **Proof-of-Ownership Verification** (questions, proof upload, AI consistency, escrow release) | ✅     | `Verification` page, `verification.use-cases`, AI consistency score, admin decide, reward escrow gate                                  |
| 4   | **Reward-Based Recovery** (reward, cash/points/reputation, leaderboard, badges)               | ✅     | rewards domain, points/reputation on `User`, `Leaderboard`, badges (`hero_finder`, `trusted_guardian`)                                 |
| 5   | **QR Tag Ecosystem** (generate, scan→anon contact, **sell branded tags**)                     | ⚠️     | tags mint/claim/scan + branded `ScanTag` landing + share CTA done. **Missing: tag commerce / "buy tags" purchase flow** (monetization) |
| 6   | **Anonymous Chat** (no number sharing, auto-moderation, scam detection)                       | ✅     | `Chat` page + threads, content-moderation port, `Safety` reports/blocks                                                                |
| 7   | **Institutional Integration** (schools/airports/transport; dashboards; SaaS)                  | ✅     | institutions domain, **self-serve lead flow (new)**, partner portal, admin review. ⚠️ SaaS **billing** not built                       |
| 8   | **"Found It Near You" Camera / AR Mode** (AR overlay of nearby items)                         | ❌     | **Not built.** Candidate: camera + map-AR overlay of nearby open items                                                                 |
| 9   | **Courier Recovery** (in-app delivery, rider, fees)                                           | ✅     | `Courier` page, courier jobs + state machine + fees, public tracking                                                                   |
| 10  | **Theft vs Lost Classification** (stolen escalation, police, crime hotspots)                  | ✅     | `item.classification` lost/stolen, `police.routes`, stolen-report PDF. ⚠️ crime-hotspot analytics light                                |
| 11  | **Memory Vault** (receipts, serials, photos)                                                  | ✅     | `Vault` page, encrypted vault entries (libsodium cipher)                                                                               |
| 12  | **Social Virality** (share card; **auto-post WhatsApp/X/Instagram**)                          | ⚠️     | share-card endpoint + `ShareButton` + QR share done (Web Share API). **Missing: explicit one-tap WhatsApp/X/Instagram intents**        |
| 13  | **Marketplace for Unclaimed Items** (auction, donation, recycling)                            | ⚠️     | listings + bids + auction/donation built. **In progress: auto-close settlement** (winner, notify, payout)                              |
| 14  | **AI Description Generator** (image → title/desc/keywords)                                    | ✅     | `describeImage` use-case, `PostItem` auto-suggest title/description/tags                                                               |
| 15  | **Trusted Finder Network** (verified finders, background checks, priority)                    | ⚠️     | `trustedFinder` flag + promotion + badge. **Missing: verified-finder onboarding + background-check flow**                              |

### 8.1 Founder's explicit ask — points redeemable at institutions

> "I need institutions that will accept points gained from returning lost items in their establishments."

Status: ⚠️ partial. The data model supports it (`Institution.pointsRedeemable`, `pointToCurrencyRate`; `User.pointsBalance`; `redeemPoints` use-case). **Missing:** a partner-side redemption flow (institution staff redeem a user's points at the counter), redemption ledger/receipts, and per-institution point→value config UI in the partner portal.

### 8.2 Monetization coverage

| Stream                            | Status                                                  |
| --------------------------------- | ------------------------------------------------------- |
| Delivery fees (courier)           | ✅                                                      |
| Commission on rewards             | ⚠️ (reward release exists; commission cut not modelled) |
| QR tag sales                      | ❌                                                      |
| Institutional SaaS subscription   | ❌ (institutions exist; no billing/plans)               |
| Premium subscription (visibility) | ❌                                                      |
| Ads                               | ❌ (optional)                                           |

### 8.3 Recommended build order (gaps)

1. **Marketplace settlement** (#13) — finish winner determination + notifications + payout (in progress).
2. **Institution points redemption** (8.1) — partner-side redeem flow + ledger (founder-requested, infra mostly present).
3. **Social one-tap share intents** (#12) — WhatsApp/X/Instagram from the share card (low effort, viral).
4. **Trusted Finder verification** (#15) — application + review + background-check status.
5. **QR tag commerce** (#5) + **SaaS billing** (#7/monetization) — revenue streams.
6. **"Found Near You" AR mode** (#8) — highest novelty, highest effort; defer.

---

## 9. Batch 3 — Full Stack Features Shipped

### 9.1 API — 3 New Endpoints + 1 Enhanced

| Feature                       | Files                                                                                                                                  | Detail                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /v1/courier/jobs/my`     | `courier.use-cases.ts`, `courier.routes.ts`, `container.ts`, `client.ts`                                                               | List user's courier jobs (as requester or rider)                                                  |
| `GET /v1/courier/jobs/:id`    | `courier.use-cases.ts`, `courier.routes.ts`, `container.ts`, `client.ts`                                                               | Get single job by ID with ownership check                                                         |
| `GET /v1/marketplace/bids/my` | `repositories.ts`, `marketplace.repository.mongo.ts`, `marketplace.use-cases.ts`, `marketplace.routes.ts`, `container.ts`, `client.ts` | List current user's bids with `BidDTO`                                                            |
| `GET /v1/admin/stats`         | `get-admin-stats.ts`, `admin.routes.ts`, `container.ts`, `client.ts`                                                                   | Live admin dashboard stats (users, items, marketplace, institutions, courier, match success rate) |

### 9.2 API — Marketplace Settlement Pipeline

| Feature        | Files                                                                                                                        | Detail                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Settlement     | `marketplace-listing.entity.ts`, `marketplace.use-cases.ts`, `marketplace.routes.ts`, `jobs.ts`, `container.ts`, `client.ts` | `closeAuction()` determines winner from `highBidId`, publishes `marketplace:settled` to winner + seller, scheduler calls per-listing settlement |
| Get listing    | `marketplace.use-cases.ts`, `marketplace.routes.ts`                                                                          | `GET /v1/marketplace/:id` returns listing with bids                                                                                             |
| Close listing  | `marketplace.routes.ts`                                                                                                      | `POST /v1/marketplace/:id/close` (admin/partner_admin)                                                                                          |
| Cancel listing | `marketplace-listing.entity.ts`                                                                                              | `cancel()` sets `status: 'cancelled'`                                                                                                           |

### 9.3 API — Notification System

| Feature                     | Files                                                                      | Detail                                                                                                |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Notification entity + model | `domain/notification/`, `models/notification.model.ts`, `repositories/`    | `Notification` with type, title, body, data, read status                                              |
| Notification use cases      | `notification.use-cases.ts`                                                | List, mark read, mark all read, count unread, create                                                  |
| Notification routes         | `notification.routes.ts`, `app.ts`                                         | `GET /`, `POST /:id/read`, `POST /read-all`, `GET /unread-count`                                      |
| Event hooks                 | `PlaceBidUseCase`, `TransitionCourierJobUseCase`, `GenerateMatchesUseCase` | Creates notifications on outbid, courier update, new match                                            |
| Client methods              | `client.ts`                                                                | `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `getUnreadNotificationCount` |

### 9.4 API — Item Expiry & Bump

| Feature       | Files                                                         | Detail                                                                             |
| ------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Expiry fields | `item.entity.ts`, `item.model.ts`, `item.repository.mongo.ts` | `expiresAt`, `bumpedAt` on items                                                   |
| Bump use case | `bump-item.ts`, `items.routes.ts`, `container.ts`             | `POST /v1/items/:id/bump` resets expiry +30 days                                   |
| Scheduler     | `jobs.ts`                                                     | `items.auto-archive` sends 3-day and 1-day reminder emails, archives expired items |
| Email service | `resend.email-service.ts`, `services.ts`                      | `sendExpiryReminder`, `sendUrgentExpiryReminder`                                   |

### 9.5 API — Ending-Soon Auction Reminders

| Feature        | Files                                                                                      | Detail                                                                              |
| -------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Reminder flags | `marketplace-listing.entity.ts`, `marketplace.model.ts`, `marketplace.repository.mongo.ts` | `reminder24hSent`, `reminder1hSent`                                                 |
| Scheduler job  | `jobs.ts`                                                                                  | `marketplace.ending-soon` runs every 5min, notifies bidders 24h and 1h before close |

### 9.6 API — User Management

| Feature        | Files                                                                       | Detail                                                                  |
| -------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| User status    | `user.entity.ts`, `user.model.ts`, `user.mapper.ts`, `shared-types/user.ts` | `status: 'active'                                                       | 'banned' | 'suspended'` |
| User use cases | `user.use-cases.ts`                                                         | `ListUsersUseCase`, `UpdateUserStatusUseCase`, `UpdateUserRolesUseCase` |
| User routes    | `users.routes.ts`, `app.ts`, `validators/extra-schemas.ts`                  | `GET /`, `PATCH /:id/status`, `PATCH /:id/roles`                        |
| Client methods | `client.ts`                                                                 | `listUsers`, `updateUserStatus`, `updateUserRoles`                      |

### 9.7 API — Partner Redemption Access

| Feature             | Files                   | Detail                                                             |
| ------------------- | ----------------------- | ------------------------------------------------------------------ |
| Role expansion      | `redemptions.routes.ts` | `partner_admin` can `POST /confirm` and `GET /institution/:id`     |
| Institution scoping | `redemptions.routes.ts` | Partner admins can only confirm/view their own institution's codes |

### 9.8 Client-Web — 7 New UI Features

| Feature                 | Files                                                 | Detail                                                                                         |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ShareButton (enhanced)  | `components/ShareButton.tsx`, `Tags.tsx`              | Menu with Copy link, WhatsApp, X, Facebook, Native share intents                               |
| EmailVerificationBanner | `components/EmailVerificationBanner.tsx`, `App.tsx`   | Warns unverified users, resend code → 6-digit verify input                                     |
| WebPush unsubscribe     | `Settings.tsx`                                        | Toggle checks `pushManager.getSubscription()`, calls `api.unsubscribeWebPush()`                |
| CourierTrackingPage     | `pages/CourierTracking.tsx`, `App.tsx`, `Courier.tsx` | `/courier/:id` route with status Chip, route card, Stepper timeline                            |
| Password change         | `Settings.tsx`                                        | "Send password reset email" → `api.requestPasswordReset()`                                     |
| Marketplace My Bids     | `Marketplace.tsx`                                     | Collapsible card above grid, fetches `api.listMyBids()`                                        |
| AI auto-suggest         | `PostItem.tsx`                                        | Auto-triggers `api.describeImage()` on first upload, pre-fills title/description/tags          |
| Notification inbox      | `pages/Notifications.tsx`, `App.tsx`                  | `/notifications` route with type icons, unread indicators, mark-all-read, bell badge + popover |
| Feed search & filters   | `pages/Feed.tsx`, `FeedFilters`                       | Search (debounced), kind toggle, category select, city input, date range, active filter chips  |
| Item expiry badges      | `Feed.tsx`, `ItemDetail.tsx`, `Profile.tsx`           | "Expiring soon" / "Expired" badges, "Bump to top" button                                       |

### 9.9 Admin App — 2 New Features

| Feature         | Files                           | Detail                                                                                        |
| --------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| Dashboard stats | `pages/Overview.tsx`, `App.tsx` | Live stats cards, refresh button, match success rate percentage                               |
| User management | `pages/Users.tsx`, `App.tsx`    | Searchable table with roles/status Chips, ban/suspend/activate, edit roles dialog, pagination |

### 9.10 Partner App — 2 New Features

| Feature         | Files                               | Detail                                                               |
| --------------- | ----------------------------------- | -------------------------------------------------------------------- |
| Bulk QR minting | `pages/BulkMintTags.tsx`, `App.tsx` | Quantity input (1–500), mint table, copy links, CSV download         |
| Point exchange  | `pages/RedeemPoints.tsx`, `App.tsx` | Voucher code confirmation, recent exchanges list, institution-scoped |

### 9.11 Verification

- All 11 packages typecheck ✅
- `@back2u/api-client` builds ✅
- `@back2u/client-web` builds ✅
- `@back2u/admin` builds ✅
- `@back2u/partner` builds ✅

---

## 10. Batch 2 — Client-Web & API Features Shipped

### 9.1 API — 3 New Endpoints

| Feature                       | Files                                                                                                                                  | Detail                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `GET /v1/courier/jobs/my`     | `courier.use-cases.ts`, `courier.routes.ts`, `container.ts`, `client.ts`                                                               | List user's courier jobs (as requester or rider) |
| `GET /v1/courier/jobs/:id`    | `courier.use-cases.ts`, `courier.routes.ts`, `container.ts`, `client.ts`                                                               | Get single job by ID with ownership check        |
| `GET /v1/marketplace/bids/my` | `repositories.ts`, `marketplace.repository.mongo.ts`, `marketplace.use-cases.ts`, `marketplace.routes.ts`, `container.ts`, `client.ts` | List current user's bids with `BidDTO`           |

### 9.2 Client-Web — 7 New UI Features

| Feature                 | Files                                                      | Detail                                                                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ShareButton             | `components/ShareButton.tsx`, `Feed.tsx`, `ItemDetail.tsx` | One-tap share link copy via `api.getShareCard()`, Snackbar confirmation               |
| EmailVerificationBanner | `components/EmailVerificationBanner.tsx`, `App.tsx`        | Warns unverified users, resend code → 6-digit verify input, updates auth store        |
| WebPush unsubscribe     | `Settings.tsx`                                             | Toggle checks `pushManager.getSubscription()`, calls `api.unsubscribeWebPush()`       |
| CourierTrackingPage     | `pages/CourierTracking.tsx`, `App.tsx`, `Courier.tsx`      | `/courier/:id` route with status Chip, route card, Stepper timeline, details          |
| Password change         | `Settings.tsx`                                             | "Send password reset email" → `api.requestPasswordReset()`, success/error alerts      |
| Marketplace My Bids     | `Marketplace.tsx`                                          | Collapsible card above grid, fetches `api.listMyBids()`, table of bids                |
| AI auto-suggest         | `PostItem.tsx`                                             | Auto-triggers `api.describeImage()` on first upload, pre-fills title/description/tags |

### 9.3 Verification

- All 11 packages typecheck ✅
- `@back2u/api-client` builds ✅
- `@back2u/client-web` builds ✅

---

## 10. Proposed Next Batch (Batch 3)

Prioritized by **commercial impact / dev effort** ratio. All are code-buildable (no video/content creation).

### 10.1 Critical — Platform Gaps

| #   | Feature                             | Why it matters                                                                                                                                                             | Effort | Stack            |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------- |
| 1   | **Marketplace settlement pipeline** | Auto-close only flips status → 'sold'. Missing: winner determination, notify winner/seller, escrow payout, commission cut. Without this the marketplace is non-functional. | Medium | API + client-web |
| 2   | **In-app notification inbox**       | Users only get push/email. No history of matches, messages, courier updates, marketplace events. A notification page (`/notifications`) is table-stakes for retention.     | Medium | API + client-web |
| 3   | **Social one-tap share intents**    | ShareButton copies a link. Add WhatsApp, X, Instagram native share intents (`navigator.share` + platform-specific URLs) for viral growth.                                  | Low    | client-web       |

### 10.2 High-Impact Growth

| #   | Feature                                 | Why it matters                                                                                                    | Effort | Stack                        |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| 4   | **Item search & filters**               | Feed has no search, category filter, date range, or location radius. Users can't find relevant items at scale.    | Medium | API + client-web             |
| 5   | **"Ending soon" marketplace reminders** | Notify bidders 24h and 1h before auction close. Drives engagement and bid wars.                                   | Low    | API + scheduler              |
| 6   | **Item auto-bump / expiry reminders**   | Items expire after 30 days. Remind owner to bump/renew. Auto-archive if ignored. Keeps feed fresh.                | Medium | API + scheduler + client-web |
| 7   | **Partner points redemption flow**      | Institution staff scan a user's QR code → redeem points → print/issue receipt. Founder explicitly requested this. | Medium | API + partner                |
| 8   | **Bulk QR tag minting UI for partners** | Partner portal can mint 50–500 tags in one click, download CSV of codes. Scales tag distribution to institutions. | Low    | partner + API                |

### 10.3 Admin & Operations

| #   | Feature                            | Why it matters                                                                                                                   | Effort | Stack       |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| 9   | **Admin dashboard stats API + UI** | Admin overview shows static cards. Need live stats: user growth, item counts by status, match success rate, revenue, bid volume. | Medium | API + admin |
| 10  | **User management in admin**       | No way to list, ban, suspend, or change user roles from admin. Critical for trust & safety.                                      | Medium | API + admin |

### 10.4 Recommended Build Order

1. **#1 Marketplace settlement** — unblocks the marketplace revenue stream
2. **#3 Social share intents** — low effort, immediate viral uplift
3. **#4 Search & filters** — unlocks feed usability at scale
4. **#2 Notification inbox** — retention multiplier
5. **#7 Partner points redemption** — founder-requested, revenue-adjacent
6. **#6 Item expiry reminders** — feed quality + engagement
7. **#5 Ending-soon reminders** — marketplace engagement
8. **#9 Admin stats** — operations visibility
9. **#10 User management** — trust & safety
10. **#8 Bulk tag minting** — partner self-serve scaling

### 10.5 Status

✅ All 10 features shipped. See Section 9 for details.

---

## 12. Proposed Next Batch (Batch 4)

Three paths available. **Option A (Harden) is recommended first** — the platform has 30+ features but notification delivery is half-built, the scheduler isn't crash-safe, and emails are plain text.

### 12.1 Option A: Polish & Harden (Recommended)

| #   | Feature                        | Why it matters                                                                                                                         | Effort | Stack |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| A1  | **Push notification delivery** | Notification inbox saves to DB but no actual push/email fires. Hook `CreateNotificationUseCase` to `IWebPushService` + `IEmailService` | Medium | API   |
| A2  | **Queue job handlers**         | `push.broadcast` and `webpush.send` are in `JobName` but have no handlers in `job-handlers.ts`                                         | Low    | API   |
| A3  | **API rate limiting**          | Public endpoints have no rate limits. Add `express-rate-limit`                                                                         | Low    | API   |
| A4  | **HTML email templates**       | All emails are plain text. Branded HTML templates for welcome, match alert, verification, password reset                               | Medium | API   |
| A5  | **Crash-safe scheduler**       | Migrate `marketplace.auto-close` and `items.auto-archive` from in-process `setInterval` to BullMQ workers                              | Medium | API   |

### 12.2 Option B: Growth & Virality

| #   | Feature                         | Why it matters                                                         | Effort | Stack                    |
| --- | ------------------------------- | ---------------------------------------------------------------------- | ------ | ------------------------ |
| B1  | **Chat read receipts + typing** | Users can't see if messages were read or if someone is typing          | Medium | API + client-web         |
| B2  | **Item image lightbox**         | Swipeable carousel, zoom, fullscreen in `ItemDetail`                   | Low    | client-web               |
| B3  | **Map clustering**              | Feed items as clusters on map page (Mapbox `supercluster`)             | Low    | client-web               |
| B4  | **"Found Near You" camera**     | Camera view with AR overlay showing nearby items by direction/distance | High   | client-web               |
| B5  | **Trusted Finder verification** | Application form, admin review, background-check status badge          | Medium | API + client-web + admin |

### 12.3 Option C: Revenue & Operations

| #   | Feature                      | Why it matters                                                          | Effort | Stack            |
| --- | ---------------------------- | ----------------------------------------------------------------------- | ------ | ---------------- |
| C1  | **QR tag purchase flow**     | Users buy QR tags via Stripe/Flutterwave. First direct revenue          | Medium | API + client-web |
| C2  | **Institution SaaS billing** | Subscription tiers for institutions (free/pro/enterprise)               | High   | API + partner    |
| C3  | **Admin bulk actions**       | Bulk approve verifications, bulk resolve reports, bulk archive          | Low    | API + admin      |
| C4  | **Webhook system**           | Institutions configure webhooks to receive events                       | Medium | API              |
| C5  | **Admin analytics charts**   | Chart.js time-series on Overview (user growth, item volume, match rate) | Low    | admin            |

### 12.4 Cross-Option Pick (10 features)

If mixing: **A1, A2, A3, A4, A5, B1, B2, C3, C4, C5** — harden the core + add growth polish + ops tooling.

### 12.5 Status

✅ All 10 features shipped. See Section 13 for details.

---

## 13. Batch 4 — Hardening + Growth + Operations Shipped

### 13.1 API Hardening (5 features)

| Feature                    | Files                                                                                                                             | Detail                                                                                                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push notification delivery | `notification.use-cases.ts`, `resend.email-service.ts`, `generate-matches.ts`, `courier.use-cases.ts`, `marketplace.use-cases.ts` | `CreateNotificationUseCase` now fires web push + email after DB save. Per-type email routing: match→`sendMatchAlert`, message→`sendChatNotification`, courier→`sendCourierUpdate`, marketplace→`sendMarketplaceAlert`. Errors caught and logged |
| Queue job handlers         | `job-handlers.ts`, `bullmq.queue.ts`                                                                                              | `push.broadcast` iterates userIds → fetches subscriptions → sends push. `webpush.send` targets single user. Both with error logging. `enqueuePushBroadcast` / `enqueueWebPushSend` helpers added                                                |
| API rate limiting          | `middleware/rate-limit.ts`, `app.ts`                                                                                              | `publicLimiter` (100/15min), `authLimiter` (10/15min), `strictLimiter` (20/15min). Custom Redis store via `ioredis` (falls back to MemoryStore). Skips localhost. Returns JSON 429                                                              |
| HTML email templates       | `email/templates/email-templates.ts`, `resend.email-service.ts`                                                                   | 6 branded HTML templates (welcome, match alert, chat notification, password reset, expiry reminder, generic). Table layout, inline styles, teal header, plain text fallback                                                                     |
| Crash-safe scheduler       | `queue.ts`, `bullmq.queue.ts`, `job-handlers.ts`, `jobs.ts`, `server.ts`                                                          | Added `marketplace.auto-close`, `items.auto-archive`, `marketplace.ending-soon` to `JobName`. `scheduleJob()` enqueues repeatable BullMQ jobs. `registerJobs` is now async. Graceful queue shutdown on SIGTERM. Jobs are idempotent             |

### 13.2 Client-Web Growth (2 features)

| Feature                     | Files                                                                                                                                                    | Detail                                                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat read receipts + typing | `message.entity.ts`, `chat.model.ts`, `chat.repository.mongo.ts`, `chat.routes.ts`, `mark-message-read.ts`, `send-typing.ts`, `container.ts`, `Chat.tsx` | `readBy: Id[]` on messages. `MarkMessageReadUseCase` verifies participation + publishes `chat:read`. `SendTypingUseCase` publishes `chat:typing`. Auto-mark on open, debounced typing broadcast, "Read" caption on sent messages |
| Item image lightbox         | `components/ImageLightbox.tsx`, `ItemDetail.tsx`, `ItemCard.tsx`                                                                                         | Fullscreen Dialog with swipe, keyboard nav, touch support, thumbnail strip, zoom toggle, image counter, loading spinner. Click card/image to open. Multi-image grid in ItemDetail                                                |

### 13.3 Admin Operations (3 features)

| Feature                | Files                                                                                                                                                                                            | Detail                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin bulk actions     | `Verifications.tsx`, `InstitutionLeads.tsx`, `Users.tsx`, `SafetyReports.tsx`, `App.tsx`, `safety.ts`                                                                                            | Checkboxes + select-all on all admin tables. Batch approve/reject verifications, leads, safety reports. Batch ban/activate users. Progress bar + Snackbar feedback. New Safety Reports page                                                              |
| Webhook system         | `domain/webhook/`, `models/webhook.model.ts`, `repositories/webhook.repository.mongo.ts`, `webhook.use-cases.ts`, `webhooks.routes.ts`, `validators/extra-schemas.ts`, `shared-types/webhook.ts` | `Webhook` entity with URL, secret, events, active flag. CRUD routes for partner_admin (institution-scoped). `DeliverWebhookUseCase` POSTs with HMAC-SHA256 signature (`X-Back2u-Event`, `X-Back2u-Signature`). Hooked into match, courier, and bid flows |
| Admin analytics charts | `shared-types/admin.ts`, `repositories.ts`, `get-admin-stats.ts`, `components/SimpleChart.tsx`, `Overview.tsx`                                                                                   | `countPerDay` aggregation on User/Item/Match repos. `usersPerDay`, `itemsPerDay`, `matchesPerDay` in `AdminStatsDTO`. Custom MUI Box bar chart component with tooltips. 30-day trend section on Overview                                                 |

### 13.4 Client-Web Map Enhancement (1 feature)

| Feature        | Files           | Detail                                                                                                                                                                                                                                                               |
| -------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map clustering | `pages/Map.tsx` | `supercluster` integration. GeoJSON Point features from items. Cluster markers sized by count, colored by kind ratio. Individual pins with Popup (title, kind chip, link). "My location" button. Kind filter (All/Lost/Found). Click cluster → fly to expansion zoom |

### 13.5 Verification

- All 11 packages typecheck ✅
- `@back2u/api-client` builds ✅
- `@back2u/client-web` builds ✅
- `@back2u/admin` builds ✅
- `@back2u/partner` builds ✅

---

## 11. Hardening & Growth Shipped (this engagement, post-original-plan)

Beyond §3–§4, the following landed and are typecheck/build-verified:

- **Profile editing** end-to-end (`PATCH /v1/me`, avatar upload, auth-store sync); `toUserDTO` completed (was dropping `phoneVerified`/`badges`/`locale`).
- **Web-push unsubscribe** (typed client + Settings toggle, contract-safe error handling).
- **QR viral "Share this tag"** CTAs (ScanTag + Tags) on a shared `shareLink` helper.
- **Mobile delete-account confirmation** dialog.
- **Self-serve institution lead flow**: public `POST /v1/institutions/leads`, Lead entity + Mongo repo, admin review page, website PartnerForm wired (verified live).
- **Centralized URL config**: `APP_PUBLIC_URL` + `AppUrls` service; 5 hardcoded `back2u.app` links removed.
- **Multi-currency config**: `DEFAULT_CURRENCY`/`SupportedCurrency` single source; 19 hardcoded `'GHS'` literals replaced.
- **Brand redesign**: "warm editorial reunion" system — **Fraunces** (headings) + **Outfit** (body) across all apps (shared `back2uTheme` + per-app font links), distinctive marketing site, redesigned **Navbar** + **Footer**, and filled empty pages (Privacy, Terms, Download, 404).

### 11.1 Tech-debt still open

- **Observability** — `IErrorReporter` exists but is **not injected**; email/SMS/push/escrow adapters log-and-swallow failures. Wire reporter + add a production startup check for missing critical provider keys. _(in progress)_
- **Crash-safe scheduler** — `in-process.scheduler` is not multi-instance safe; migrate marketplace auto-close to BullMQ.
- **Integration tests** — matching + reward-release + courier state machine still need automated coverage.

---

_End of plan._

---

## 14. Batch 5 — Growth + Hardening + Operations Shipped

### 14.1 Client-Web Growth (3 features)

| Feature                    | Files                                                                                                                                                                                | Detail                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat image attachments     | `message.entity.ts`, `chat.model.ts`, `chat.repository.mongo.ts`, `post-message.ts`, `chat.routes.ts`, `Chat.tsx`                                                                    | `images: { url }[]` on messages. Upload via Cloudinary, max 3 images. Thumbnails in bubbles, click opens ImageLightbox. Body or images required |
| Trusted Finder application | `trusted-finder-application.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `TrustedFinderApply.tsx`, `TrustedFinderApplications.tsx`, `Settings.tsx`, `Profile.tsx` | Application form with ID photo + bio. Admin review page with approve/reject. Badge on profile. Settings link                                    |
| Item bookmarks/favorites   | `bookmark.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `Bookmarks.tsx`, `ItemCard.tsx`, `ItemDetail.tsx`, `Feed.tsx`                                              | Bookmark toggle on cards + detail. `/bookmarks` page. `bookmarkCount` on items. Auth-gated                                                      |

### 14.2 API Hardening (3 features)

| Feature                  | Files                                                                                                                                                                                                  | Detail                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Search autocomplete      | `item.repository.mongo.ts`, `autocomplete-search.ts`, `items.routes.ts`, `Feed.tsx`                                                                                                                    | `GET /v1/items/autocomplete?q=` returns distinct cities + categories. MUI Autocomplete dropdowns in Feed. Recent searches in localStorage                                                  |
| Item duplicate detection | `detect-duplicate-item.ts`, `item.entity.ts`, `item.model.ts`, `create-item.ts`                                                                                                                        | AI scores recent items by text/image/geo/time similarity. Flags if > 0.85. Creates system notification + `flaggedForReview` flag. Admin can clear                                          |
| API observability        | `composite.reporter.ts`, `services.ts`, `resend.email-service.ts`, `twilio.sms-service.ts`, `web-push.service.ts`, `expo.push-service.ts`, `hubtel.escrow.ts`, `provider-check.ts`, `health.routes.ts` | `IErrorReporter` wired via `CompositeErrorReporter` (Sentry + console). Injected into all adapters. Production startup checks critical keys (fail-fast). Health endpoint checks DB + Redis |

### 14.3 Admin + Partner Operations (2 features)

| Feature                  | Files                                                                                                        | Detail                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Content moderation queue | `moderation-queue-item.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `ModerationQueue.tsx` | Auto-flagged items from `scoreMessage`. Admin table with type, score, status, approve/remove actions. Filter by type/status. Sorted by score   |
| Partner analytics        | `get-partner-stats.ts`, `partner.routes.ts`, `PartnerAnalytics.tsx`                                          | `GET /v1/partner/stats` (institution-scoped). Items by status, redemptions + points, courier jobs. Custom MUI bar chart. Recent activity lists |

### 14.4 Testing + Website (2 features)

| Feature           | Files                                                                                                                       | Detail                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integration tests | `test-db.ts`, `auth-helper.ts`, `test-container.ts`, `auth.flow.test.ts`, `item.match.flow.test.ts`, `courier.flow.test.ts` | 3 e2e test suites: auth flow (register→login→me→refresh→logout), item+match flow (post→match→accept), courier flow (request→accept→pickup→deliver). Test container with stubs |
| Public map embed  | `MapEmbed.tsx`, `App.tsx`                                                                                                   | `/map` on website. Public Mapbox map with supercluster clustering. Kind filter. Popups with links to app. SEO meta                                                            |

### 14.5 Verification

- All 11 packages typecheck ✅
- Integration tests pass (10 tests across 3 suites) ✅
- Smoke tests pass (5/5) ✅

---

_End of plan._

---

## 15. Batch 6 — Revenue + Mobile + Trust & Safety Shipped

### 15.1 Revenue (1 feature)

| Feature              | Files                                                                                                                        | Detail                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QR tag purchase flow | `qr-tag-product.entity.ts`, `qr-tag-order.entity.ts`, `models/`, `repos/`, `use-cases.ts`, `tags.routes.ts`, `QrTagShop.tsx` | Product packs (5 tags ₵25, 20 tags ₵80). Cart + checkout + simulated payment. Order history. Mint tags on fulfilment. Seed migration for default products |

### 15.2 Mobile (1 feature)

| Feature  | Files                       | Detail                                                                                                                                                                                                                                  |
| -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real map | `client-mobile/app/map.tsx` | `react-native-maps` MapView with Marker pins (red=lost, green=found). Callouts with title + link. `fitToCoordinates`. "My location" button with `expo-location`. Kind filter chips. Requires Google Maps API key for Android production |

### 15.3 Trust & Safety (3 features)

| Feature                      | Files                                                                                                                                                 | Detail                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Item review/rating           | `review.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `review.ts`, `ItemDetail.tsx`, `Profile.tsx`                                  | 1-5 star reviews after item returned. `averageRating` + `reviewCount` on user. Review prompt on returned items. Reviews section on profile |
| Trusted Finder application   | `trusted-finder-application.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `TrustedFinderApply.tsx`, `TrustedFinderApplications.tsx` | ID photo + bio application. Admin review with approve/reject. Badge on profile. Settings link                                              |
| Return confirmation workflow | `match.entity.ts`, `confirm-item-return.ts`, `matches.routes.ts`, `Matches.tsx`, `Profile.tsx`                                                        | Both parties confirm return. Items marked `returned` when both confirm. +50 points and +10 reputation to both. Audit log + realtime event  |

### 15.4 Operations + Admin (3 features)

| Feature                  | Files                                                                                                                                 | Detail                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Admin audit timeline     | `AuditLog.tsx`                                                                                                                        | Timeline + Table toggle views. Colored dots by action type. Date grouping. Relative timestamps. Clickable entity/actor filters. Export CSV. Actor name lookup            |
| Content moderation queue | `moderation-queue-item.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `ModerationQueue.tsx`                          | Auto-flagged items from `scoreMessage`. Admin table with score, type, status. Approve/remove actions. Filter by type/status                                              |
| Feature flags            | `feature-flag.entity.ts`, `model.ts`, `repo.ts`, `use-cases.ts`, `routes.ts`, `feature-flags.ts`, `auth.store.ts`, `FeatureFlags.tsx` | `enabled` + `rolloutPercentage` + `allowedUserIds`. Consistent hashing for rollouts. Guards on AI auto-suggest, marketplace, QR promo. Admin management page with slider |

### 15.5 API Hardening + Partner (2 features)

| Feature                  | Files                                                                                                        | Detail                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API observability + docs | `composite.reporter.ts`, `swagger.ts`, `app.ts`                                                              | `IErrorReporter` wired into all adapters. Production startup checks. Health endpoint. Swagger UI at `/docs` with 29 endpoints + 19 schemas                                 |
| Partner public API       | `partner-api-key.entity.ts`, `model.ts`, `repo.ts`, `middleware/partner-api-key.ts`, `partner-api.routes.ts` | API-key auth for institutions. `X-API-Key` header + HMAC. Rate limited (1000/hr). Endpoints: list items, get item, create item, update status, stats. Admin key management |

### 15.6 Growth + UX (2 features)

| Feature                 | Files                                                                                | Detail                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Search autocomplete     | `autocomplete-search.ts`, `Feed.tsx`                                                 | `GET /items/autocomplete?q=` returns cities + categories. MUI Autocomplete dropdowns. Recent searches in localStorage                        |
| Email preference center | `user.entity.ts`, `notification.use-cases.ts`, `me-extras.routes.ts`, `Settings.tsx` | `emailPreferences` on user (marketing, matches, chat, reminders, courier). Notification delivery respects prefs. Toggle switches in Settings |

### 15.7 Courier + Analytics (2 features)

| Feature                    | Files                                                               | Detail                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Courier route optimization | `courier.use-cases.ts`, `courier.routes.ts`, `Courier.tsx`          | Greedy TSP route calculation. `POST /courier/route` with waypoints. `GET /courier/jobs/open/nearby` with distance estimates. Multi-select + "Plan route" in client-web |
| Partner analytics          | `get-partner-stats.ts`, `partner.routes.ts`, `PartnerAnalytics.tsx` | Institution-scoped stats. Items by status, redemptions + points, courier jobs. Custom MUI bar chart. Recent activity lists                                             |

### 15.8 Verification

- All 11 packages typecheck ✅
- Integration tests pass (10 tests across 3 suites) ✅
- Unit tests pass (30+ tests) ✅
- Smoke tests pass (5/5) ✅

---

_End of plan._

---

## 16. Batch 7 — Mobile Parity + Revenue + Performance Shipped

### 16.1 Mobile Parity (6 features)

| Feature                     | Files                                             | Detail                                                                                                                          |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Mobile bookmarks            | `apps/client-mobile/app/bookmarks.tsx`            | Card list with item image, title, remove button. Link from More screen. Filter-null type guard                                  |
| Mobile notifications        | `apps/client-mobile/app/notifications.tsx`        | Grouped inbox with type icons (match/message/courier/marketplace/tag/system). Mark all read. Time ago. Tap to navigate          |
| Mobile QR tag shop          | `apps/client-mobile/app/shop.tsx`                 | Product cards with quantity steppers, cart summary, order history. Links from tags + More                                       |
| Mobile Trusted Finder apply | `apps/client-mobile/app/trusted-finder-apply.tsx` | Bio input, ID photo upload via expo-image-picker + Cloudinary. Status display. Link from profile                                |
| Mobile courier tracking     | `apps/client-mobile/app/courier-tracking.tsx`     | Status timeline (requested→accepted→picked_up→in_transit→delivered). Job details, distance, est. time. Link from courier screen |
| Mobile found near you       | `apps/client-mobile/app/found-near-you.tsx`       | Location-based found items. Radius filters (1km–50km). List/map toggle. Uses `expo-location`                                    |

### 16.2 Revenue (1 feature)

| Feature                      | Files                                                                                                        | Detail                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paystack payment integration | `apps/api/src/infrastructure/payments/paystack/paystack.service.ts`, `qr-tag.use-cases.ts`, `tags.routes.ts` | Initialize transaction → auth URL → webhook → fulfil. HMAC-SHA512 webhook signature verification. Graceful fallback to simulated flow when Paystack not configured. `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` env vars |

### 16.3 Performance (1 feature)

| Feature             | Files                                                                                                           | Detail                                                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Redis caching layer | `apps/api/src/application/ports/cache.ts`, `apps/api/src/infrastructure/cache/redis-cache.ts`, use-case updates | `ICache` port with get/set/del/invalidatePattern. Cache hot paths: item feed (30s), leaderboard (60s), tag products (300s). Write-through invalidation on item create/update/bump. Graceful no-op when Redis unavailable |

### 16.4 Push Deep Linking (1 feature)

| Feature                        | Files                                                                                                                      | Detail                                                                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push notification deep linking | `apps/client-mobile/src/lib/push.ts`, `apps/client-mobile/app/_layout.tsx`, `notification.use-cases.ts`, `job-handlers.ts` | `useLastNotificationResponse` hook navigates to relevant screen on tap. Server payload includes `screen` type + `url`/`itemId`/`threadId`. Expo push delivery added to `CreateNotificationUseCase`. `push.broadcast` queue handler added |

### 16.5 Integration Tests (1 feature)

| Feature                    | Files                                             | Detail                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reward + marketplace tests | `reward.flow.test.ts`, `marketplace.flow.test.ts` | Reward: escrow hold → match → return confirmation → reward release → finder points. Marketplace: list unclaimed → bid → auction close → winner determination. 11 total integration tests across 5 suites |

### 16.6 Supporting Changes

- `apps/client-mobile/app/(tabs)/more.tsx` — added bookmarks, notifications, shop, found-near-you links
- `apps/client-mobile/app/(tabs)/profile.tsx` — added Trusted Finder apply link
- `apps/client-mobile/app/courier.tsx` — added "My jobs" section with tracking links
- `apps/client-mobile/app/_layout.tsx` — registered 5 new screens
- `apps/api/src/config/env.ts` — added `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- `apps/api/src/application/ports/tokens.ts` — added `Cache` token
- `apps/api/src/test/test-container.ts` — added `NoopCache`
- `packages/api-client/src/client.ts` — updated `payTagOrder` return type for Paystack flow

### 16.7 Verification

- All 11 packages typecheck ✅
- 11 integration tests pass (5 suites) ✅
- Mobile app builds without errors ✅

---

_End of plan._

---

## 17. Batch 8 — Production Hardening + Partner Expansion + Mobile Completion Shipped

### 17.1 Security & Observability (4 features)

| Feature                        | Files                                | Detail                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request tracing                | `tracing.ts`, `app.ts`               | `X-Request-ID` header on every request. Propagated via AsyncLocalStorage through use cases. Included in all logs                                                                                  |
| Performance middleware         | `performance.ts`, `app.ts`           | Per-endpoint latency tracking (count, avg, p95, max). `X-Response-Time` header. Slow request warnings (>1s). `GET /health/metrics` snapshot                                                       |
| Email verification enforcement | `require-verified.ts`, route updates | `requireVerifiedEmail` middleware returns 403 for unverified users. Applied to: POST items, reward release, marketplace bids, courier requests. Configurable via `REQUIRE_VERIFIED_EMAIL` env var |
| Upload + chat abuse limits     | `abuse-limits.ts`, `app.ts`          | Per-user daily upload limit (10/day, configurable) and message rate limit (30/min, configurable). Redis-backed with TTL. Returns 429 with retry info                                              |

### 17.2 Performance (1 feature)

| Feature                 | Files                                                                                    | Detail                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor-based pagination | `item.ts` (shared types), `repositories.ts`, `item.repository.mongo.ts`, `list-items.ts` | Backward-compatible cursor pagination for item feed. Cursor = base64(lastId + createdAt). Falls back to offset when no cursor provided. `nextCursor` returned in Paginated response |

### 17.3 Developer Experience (1 feature)

| Feature              | Files                                      | Detail                                                                                                                                                                                               |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database seed script | `apps/api/src/cli/seed.ts`, `package.json` | `pnpm db:seed` creates 20 users, 30 items, 5 matches, 3 marketplace listings, 10 QR tags, 5 courier jobs, 5 rewards. Uses domain entities (not raw inserts). Idempotent — clears existing data first |

### 17.4 Partner App (2 features)

| Feature             | Files                              | Detail                                                                                                  |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Partner item list   | `PartnerItems.tsx`, `App.tsx`      | Grid view with status/kind filters, search by title/description, pagination. Links to detail view       |
| Partner item detail | `PartnerItemDetail.tsx`, `App.tsx` | Full item details, images, status chips. Actions: close item, mark returned. Internal notes placeholder |

### 17.5 Mobile (2 features)

| Feature               | Files                                       | Detail                                                                                                                                      |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile reset password | `reset-password.tsx`, `_layout.tsx`         | Dual-mode screen: forgot-password form (email → request reset link) and token-based reset (new password + confirm). Links from login screen |
| Mobile reviews        | `reviews.tsx`, `profile.tsx`, `_layout.tsx` | Star rating display, review list with avatar, comment, date. Average rating header. Link from profile screen                                |

### 17.6 Supporting Changes

- `apps/api/src/domain/shared/errors.ts` — added `TooManyRequestsError`
- `apps/api/src/config/env.ts` — added `REQUIRE_VERIFIED_EMAIL`, `UPLOAD_DAILY_LIMIT`, `MESSAGE_RATE_LIMIT`
- `packages/shared-types/src/api.ts` — added `nextCursor` to `Paginated<T>`
- `packages/shared-types/src/item.ts` — added `cursor` to `ItemListQuery`
- Route files updated with `requireVerifiedEmail` middleware: `items.routes.ts`, `rewards.routes.ts`, `marketplace.routes.ts`, `courier.routes.ts`

### 17.7 Verification

- All 11 packages typecheck ✅
- 11 integration tests pass (5 suites) ✅
- Mobile app builds without errors ✅
- Partner app builds without errors ✅

---

_End of plan._

## Console login redesign — 2026-09-07

- **Status: Complete.** Admin and partner login presentation redesigned with a shared `ConsoleLoginLayout`, role-specific copy, sage/stone panels, a recovery-tag illustration, clearer forms, and a compact mobile layout.
- **Scope:** `apps/admin/src/pages/Login.tsx`, `apps/partner/src/pages/Login.tsx`, `packages/ui-web/src/ConsoleLoginLayout.tsx`, and its shared export. Existing authentication, MFA, and role checks retained; password visibility labels now reflect their state.
- **Verification:** Admin and partner production builds passed (Vite reports large bundle warnings). Browser review covered both desktop pages, both password visibility controls, and partner mobile at 390px and 320px; no horizontal overflow at 320px. `git diff --check` passed. Live account sign-in and MFA were not exercised.
- **Existing work preserved:** Client feed and shared theme edits were already present and were not modified by this task.

## Success story card redesign — 2026-09-07

- **Status: Implemented.** Reworked the reusable item in `apps/website/src/components/SuccessStories.tsx`: item icon/header, prominent recovery time, readable quote, and author footer. Existing story copy and section grid retained.
- **User refinement:** Added neumorphic raised cards, softly raised item icons and avatars, and inset recovery details using theme-aware shadows.
- **Verification:** Website production build passed with bundle-size warnings; `git diff --check` passed. Initial desktop design reviewed in browser. Final neumorphic/mobile/dark visual checks could not be completed because browser connection calls timed out.

## Testimonial card polish — 2026-09-07

- **Status: Complete.** Applied the approved story-card direction to the three homepage testimonials in `apps/website/src/App.tsx`: raised rounded cards, raised quote icons and author avatars, inset highlights grounded in existing quotes, and separated author footers. Featured forest-green card retained; neutral cards follow the active theme.
- **Verification:** Website production build passed with bundle-size warnings. Desktop screenshot reviewed and mobile layout inspected at 390px. `git diff --check` passed.

## Recent item card redesign — 2026-09-07

- **Status: Implemented.** Applied the approved neumorphic direction to the homepage recent-item cards in `apps/website/src/App.tsx`: raised rounded surfaces, recessed photo frames, raised category labels, timestamps below photos, wrapping titles, and inset location icons. Existing API data and lost/found labels retained.
- **Verification:** Website production build and `git diff --check` passed; Vite reports bundle-size warnings. The local browser did not render the API-fed recent-items section, so final visual verification with item data remains outstanding.

## Restore console login neumorphism — 2026-09-07

- **Status: Complete.** Restored soft depth in the shared `ConsoleLoginLayout`: warm neutral ground, raised form and brand panels, recessed inputs, raised icons/labels, and a raised green submit button with a pressed state. Admin sage and partner stone palettes and authentication/MFA logic retained.
- **Verification:** Both production builds passed with bundle-size warnings. Browser review covered admin mobile and partner mobile/desktop, plus admin input focus. Adjusted input selector specificity so page-level field styles cannot flatten the shared treatment. `git diff --check` passed.

## Customer login dark-mode contrast — 2026-09-07

- **Status: Complete.** Located the supplied screenshot at client-web `/login` (`apps/client-web/src/pages/Login.tsx`). Replaced fixed dark-green form heading/account-link colors with `text.primary`, and sign-in label/recovery-link colors with `primary.main`. Added an h1 and visible keyboard focus outlines to account links. Authentication behavior unchanged.
- **Verification:** Client-web production build passed with bundle-size warnings. Browser review at 390px confirmed dark-mode heading `#EAF3ED` and recovery link `#A8B5A0`; light-mode heading remains `#2E3D2F`. Scoped diff whitespace check passed.

## Customer login input icons and neumorphism — 2026-09-07

- **Status: Complete.** Added leading email, lock, and authentication-code icons; email/code clear controls appear when populated, and password visibility remains an accessible end action. Labels stay visible. Applied theme-aware raised card/button surfaces, recessed inputs, raised end controls, and visible focus/error outlines to customer `/login`.
- **Verification:** Client-web production build passed with bundle-size warnings. Reviewed 390px light/dark screenshots; browser checks confirmed email clearing and password visibility. MFA presentation compiled but was not exercised through a live account. Scoped diff check passed.

## Customer login placeholders and color refinement — 2026-09-07

- **Status: Complete.** Added email, password, and MFA code placeholders; strengthened theme-aware placeholder/label/icon colors and darkened the bronze submit button for white-text contrast. Restored the desktop brand panel's fixed forest background so its cream text remains readable. Existing neumorphic styling retained.
- **Verification:** Client-web build passed with bundle-size warnings; light/dark mobile screenshots reviewed at 390px. Scoped diff check passed. MFA placeholder is implemented but not live-account tested.

## Mobile client header title and icon shadows — 2026-09-07

- **Status: Complete.** Restored the bak2me wordmark at mobile widths in `packages/ui-web/src/AppShell.tsx`; only the tagline remains hidden on small screens. Unified client header theme, menu, and notification controls around a fixed forest surface, restrained paired shadows, inset pressed states, and visible focus rings in `apps/client-web/src/App.tsx`.
- **Verification:** Client-web production build passed with bundle-size warnings. Dark mobile header reviewed at 390px; header width checked at 320px without overflow; menu open/close and theme switching verified. Scoped diff check passed.

## Client mobile menu contrast and shadows — 2026-09-07

- **Status: Complete.** Replaced fixed dark labels/icons in shared menu rows with theme-aware text, primary, and error colors. Tuned drawer action/close-button shadows to its surface, removed the green drawer glow, differentiated the primary registration action, and constrained width to the viewport. Added keyboard focus outlines.
- **Verification:** Client-web build passed with bundle-size warnings. Light/dark drawer screenshots reviewed, menu open/close verified, and drawer measured at 320px without horizontal overflow. Scoped diff check passed.

## Notification preview redesign — 2026-09-07

- **Status: Complete.** Redesigned `apps/website/src/components/PushNotifyDemo.tsx` with a raised branded notification header, possible-match headline, recessed item/location panel, and explicit demo label. Existing demo notification behavior retained.
- **Verification:** Website production build passed with bundle-size warnings; desktop and 390px mobile screenshots reviewed. Scoped diff check passed. Browser notification permissions were not requested during visual checks.

## Pricing specification reconciliation and redesign — 2026-09-07

- **Status: Complete.** Rebuilt `/pricing` with pronounced neumorphic personal/free and institution sections, raised plan cards, inset prices, featured forest Pro plan, separate optional-cost explanations, and accessible FAQs. Shared website navigation/footer restored.
- **Source:** Read `Bak2Me_Points_Rewards_Partners_Anti_Fraud_Specification.docx` (September 2026 v1.0), especially sections 3–4, 11, 13–15, 18, and 24. It defines loyalty/reward/partner economics but does not prescribe subscription prices. Current monthly institution amounts come from `packages/shared-types/src/billing.ts`: Starter free, Pro GHS500, Enterprise GHS2,000.
- **Drift prevention:** Website now imports `SUBSCRIPTION_PLANS`, the same catalogue exposed by `/v1/institutions/plans` and used by partner billing. Added the workspace dependency and a three-line lockfile entry only; discarded unrelated dependency-resolution churn.
- **Corrections:** Removed unsupported GHS19 Premium offer, coming-soon/popularity claims, 14-day trial, seven-day refund promises, and individual premium entitlements. Excluded the catalogue's `Custom point→cash rates` marketing bullet because the specification says BakPoints are not freely convertible to cash. No private fraud rules are published.
- **Commercial boundary:** Existing subscription use case updates institution tier/renewal metadata but does not collect payment. Public paid-plan CTAs therefore lead to the partner enquiry form, with scope/billing confirmation language. Backend billing enforcement and catalogue's cash-rate terminology remain outside this page change.
- **Verification:** Website production build passed with bundle-size warnings. Desktop/light and 390px/dark screenshots reviewed, correct amounts confirmed in DOM, no horizontal overflow at 390px, FAQ expand state checked, and Pro enquiry navigated to `/partner`. No enquiry submitted. Scoped diff check passed.

## Partner page, customer feed, and FAQ spacing — 2026-09-07

- **Status: Complete.** Redesigned website `/partner` with the shared public shell, stronger introduction, inset benefits, raised three-step enquiry form, themed inputs/placeholders, clearer step copy, and mobile enquiry shortcut. Removed unverified automatic-reunion/48-hour onboarding claims. Existing request payload and validation retained.
- **Customer feed:** Redesigned `/` with a clear report/map entry point, structured search/location/category/date controls, pressed report-type filters, reset action, and responsive spacing. Shared `ItemCard` now matches the approved lost-item style: raised rounded card, recessed photo frame, wrapping title/location, quieter metadata, and spaced actions. Photo previews are keyboard-accessible buttons; bookmark controls have accessible labels.
- **Pricing FAQ:** Added explicit 20px mobile / 24px desktop horizontal padding to questions and answers, 72px summary height, and spacing before the expand icon.
- **Verification:** Website and client production builds passed with bundle-size warnings. Partner wizard tested through all three steps using preview values without submitting; mobile light/dark partner screenshots reviewed at 390px with no overflow, and enquiry shortcut checked. Feed loaded real API items; Lost filter returned 15 lost reports, photo preview opened/closed, and 390px layout had no horizontal overflow. FAQ measured 24px desktop left/right padding and expand state verified. Scoped diff check passed.

### Item detail redesign — 2026-09-07

- Status: DONE.
- Redesigned customer item detail with raised photo and information panels, recessed fact tiles, readable heading, and theme-aware surfaces matching the feed.
- Added keyboard-accessible photo buttons and a signed-out sign-in action; retained existing verification, bookmark, review, bump, and reporting behavior.
- Validation: client production build passed (existing chunk-size warnings); photo viewer opened and closed; image loaded; mobile dark mode checked at 390px with no horizontal overflow. Authentication-dependent mutations were not submitted.

### Customer header refinement — 2026-09-07

- DONE: sentence-case navigation, recessed active tab, separated account actions, raised sage registration button, quieter header texture and surface shadow.
- Verified desktop rendering and mobile menu availability; client production build passed with existing chunk-size warnings.

### Registration redesign — 2026-09-07

- DONE: responsive two-column community introduction and raised registration form, Outfit headings, recessed inputs, persistent labels, placeholders, autofill hints, clear controls and password visibility toggle. Surface-matched icon shadows avoid the previous green glow.
- Preserved registration API and auth behavior; native required/email/minimum-password validation replaces the disabled-until-password entry point.
- Validation: production build passed; dark desktop and light mobile reviewed, no horizontal overflow at 390px; clear-name and password-toggle controls verified. No account created during verification.

### Landing page hero and motion — 2026-09-07

- DONE: new editorial hero with staggered masked headline, sequenced lost/returned story cards, sculpted key medallion and animated SVG connection path. Replaced radar and illustrative confidence percentage.
- Added short sibling stagger to existing page scroll reveals and refined their entry transform. New animations are finite and disabled under reduced-motion preference; existing reduced-motion fallback retained.
- Retained lost/found CTA routes and download links. Website build passed with existing bundle warnings; desktop light and mobile dark visual review completed; 390px layout has no horizontal overflow and headline animation styles and CTA destinations verified.

### Landing page final sections — 2026-09-07

- DONE: restored mobile navbar wordmark; redesigned institution tiles, referral panel, FAQ, closing CTA, and footer using consistent readable headings and neumorphic surfaces.
- Replaced disconnected referral form with copyable site invitation and removed unsupported 50-point promise. Replaced local-only newsletter success with direct contact link.
- Website build passed with existing chunk warnings. Browser verified mobile 390px width without horizontal overflow and FAQ expansion; checked contact and navigation targets. No email or invitations sent.

### Institution type selector — 2026-09-08

- DONE: redesigned partner enquiry options with venue icons, titles, descriptions, rounded rows, focus outlines and a selected checkmark. The closed selector also shows the selected icon and description; original values and form handling retained.
- Validation: website production build passed with existing chunk-size warnings; browser reviewed expanded and collapsed dark-theme layouts. Automated selection verification timed out; mobile layout was not browser-tested.

### Website navigation neumorphism — 2026-09-08

- DONE: recessed desktop navigation tray with sentence-case links, pressed active state and focus rings; responsive sidebar with raised link cards, inset venue/navigation icons, descriptions and current-route indicators. Added matching sign-in card and scrollable drawer layout.
- Validation: website production build passed (existing chunk-size warnings); dark desktop and light mobile (390px) visually reviewed; mobile page has no horizontal overflow. Sidebar Pricing link navigated and closed the drawer successfully.

### Download feature cards — 2026-09-08

- DONE: replaced the three plain feature columns with raised neumorphic cards, inset camera/notification/chat icons, concise utility labels, Outfit headings and revised descriptions. Expanded the desktop row beyond the hero text width and stacked cards on mobile.
- Validation: website production build passed with existing chunk-size warnings; light desktop and dark mobile reviewed in browser; 390px viewport has no horizontal overflow. Existing download links and phone illustration retained.

### Public map redesign — 2026-09-08

- DONE: theme-aware light/dark basemaps; opaque readable control surfaces; inset filters with status colors and report count; redesigned popup with status icon, wrapping title, location and high-contrast app link. Mobile reports use a bottom sheet within the map. Filter changes clear stale selected reports.
- Validation: website production build passed (existing chunk-size warnings); live API loaded 30 reports, Lost filter returned 15 and showed pressed state, cluster expansion and item popup verified. Light/dark desktop and 390px mobile reviewed; mobile has no horizontal overflow.

### Partner Overview redesign — 2026-09-08

- DONE: extracted the Overview into a dedicated page with raised summary cards, inset icons and chart tracks, readable Outfit typography, lost/found ring, recovery status and category breakdowns, recent-report links and three operational shortcuts.
- Added loading skeletons, retryable errors and an empty state. Renamed the matched count accurately and disclosed the loaded-report scope for breakdowns. Existing report query, authentication and other partner pages retained.
- Validation: partner production build passed with existing chunk-size warning; authenticated browser showed 30 reports / 15 lost / 15 found, dark desktop and light mobile reviewed, 390px had no horizontal overflow, Manage items navigated to /items.
- Scope: Overview complete; other partner pages remain for subsequent page-by-page redesigns.

### Partner Items and mobile header — 2026-09-08

- DONE: rebuilt Items with neumorphic search/type/status controls, responsive image cards, readable status/category/location/date details, image fallbacks and clear report links. Added retryable errors, loading cards, empty-state filter reset and search pagination reset; status selector includes all defined item statuses.
- DONE: mobile header now has a dedicated page-title row and a compact brand/control row. Retains notifications, theme and account controls; tutorial remains in the account menu. Added accessible mobile-navigation label and expanded state.
- Validation: partner production build passed with existing chunk warning; Lost filter returned 15 matches, unmatched search rendered the empty state, mobile drawer navigated to Overview, and account menu retained tutorial access. Dark desktop/light mobile reviewed; header fits at 320px with no horizontal overflow.

### Partner Analytics redesign — 2026-09-08

- DONE: raised summary cards, inset icons, sage/amber status breakdown, defined return-rate ring, rewards/courier panels and recent activity with item links. Added explicit institution scope, last-updated time, refresh state, loading skeletons and recoverable errors that preserve existing data.
- Return rate is returned / total reported items; displays a dash when no reports exist. Removed the unsupported turnaround-time description. No invented trends or date filters added.
- Validation: partner production build passed with existing chunk-size warning; authenticated institution currently has zero activity, so empty states were verified in dark desktop and light mobile at 390px with no horizontal overflow. Refresh completed and re-enabled the control. Populated analytics were not available for live visual verification.

### Partner Recovery Point redesign — 2026-09-08

- DONE: neumorphic standing summary, section navigation, side-by-side counter/team management, inset staff/counter rows, icon-led headings, responsive intake form and mobile-friendly held-property cards. Restyled setup/receipt/release dialogs and added accessible remove-control labels.
- Added query failure alerts with retry, active-counter guidance and persistent mutation-error snackbars. Retained all counter/staff, custody intake, receipt and verified-owner release API flows.
- Validation: partner production build passed with existing chunk-size warning; authenticated dark desktop/light mobile at 390px reviewed with no horizontal overflow. Counter and staff dialogs opened/cancelled; intake jump link worked and incomplete intake remained disabled. Current shelf is empty; no deposits, codes, releases or account changes submitted.

### Partner Courier Jobs redesign — 2026-09-08

- DONE: raised dispatch cards, inset pickup/drop-off route panels, readable fee/status details, responsive accept actions, optional distance/duration estimates, open-job summary and route/reference search. Added refresh, loading cards, distinct empty/error states and acceptance feedback; existing fee values and acceptance API preserved.
- Validation: partner production build passed with existing chunk warning; five live jobs rendered, KNUST search matched one, unmatched search showed clear/reset state, and clearing restored all five. Dark desktop/light mobile reviewed; 390px had no horizontal overflow. No jobs accepted during verification.

### Partner tags, redemption, rewards and billing redesign — 2026-09-08

- DONE: shared PartnerWorkspace surfaces and headings applied to five pages; tag batch builder with presets and export guidance; voucher confirmation desk; responsive reward offer cards and editor; storefront settings with sticky live preview; neumorphic plan comparison with explicit loading/error/current-plan states.
- Fixed tag mutation to receive the validated integer quantity directly; added clipboard failure feedback. Voucher confirmation now refreshes exchange history. Storefront save is disabled during loading errors/uploads; billing waits for institution data before enabling changes and retains the existing free-tier fallback after load.
- Validation: partner production build passed with existing chunk-size warning. Reviewed all five authenticated pages; 100-tag preset updated quantity, empty voucher remained disabled, live reward cards rendered, draft dialog opened/cancelled, unsaved description updated preview, Starter plan showed current/disabled. All five pages measured 390px with no horizontal overflow.
- No tags minted, vouchers confirmed, rewards published, storefront settings saved, images uploaded or plans changed during verification. Generated-tag/export and successful mutation states were not live-tested.

### Partner notifications, profile and settings redesign — 2026-09-08

- DONE: Notifications workspace with inset All/Unread filter, readable wrapping activity rows, explicit accessible mark-read buttons, pending/error/retry states and latest-50 context.
- DONE: Profile uses shared raised panels, softer identity banner, readable avatar contrast, responsive photo controls, upload-aware save state and clipboard failure feedback.
- DONE: Settings uses responsive icon/title/description navigation, raised content panels and inset controls; existing account, security, preference and data actions retained. Navigation orientation matches desktop/mobile keyboard behavior; notification switches have accessible labels.
- DONE: Rewards storefront Category selector shows an icon, title and description in both selected value and all eight menu options, with a selected checkmark and theme-aware menu.
- VERIFIED: Partner TypeScript/production build and git diff whitespace checks pass. Existing large bundle warning remains.
- LIMITATION: Browser reached the sign-in screen with a Failed to fetch alert, so authenticated visual and interaction verification remains pending. No account records were changed during verification.

### Admin overview and trust operations redesign — 2026-09-08

- DONE: Shared AdminWorkspace presentation adds sage/cream light and dark surfaces, Outfit headings, soft raised panels, inset controls and responsive queue tables across all six requested routes.
- DONE: Overview adds platform context, direct review-queue links, icon-led metrics, tabular numbers and a statistics error state; existing charts retained.
- DONE: Verifications, trusted finder, moderation, safety and trust queues add contextual counts and review guidance. Finder status filters expose selected state; moderation filters have accessible names and visible All values. Trust decision choices show their consequences inline; review dialogs receive consistent surfaces.
- DONE: Added missing queue fetch errors and retry actions. Individual verification/safety decisions refresh their queue and report failures; buttons disable while requests are pending.
- VERIFIED: Admin TypeScript and Vite production build pass; git diff whitespace check passes. Existing large bundle warning remains.
- VERIFIED: Authenticated browser inspection of all six routes, live overview metrics, finder status filter and moderation status menu. All six pages reported scrollWidth equal to innerWidth at 390px; dark overview and light moderation visually inspected.
- LIMITATION: Available review queues were empty; populated records and decision dialogs were not exercised. No review decisions were submitted. Temporary viewport and theme changes restored.

### Admin commerce and network redesign — 2026-09-08

- DONE: Marketplace, Redemptions, Users, Institutions and Leads now use the shared admin workspace, descriptive summaries, raised cards and inset inputs.
- DONE: Marketplace listing cards have clearer pricing and timing hierarchy; creation fields stack on mobile. Redemptions adds explicit institution selection, loading, error and empty states with wrapping ledger rows.
- DONE: Users directory adds current-page context, readable table styling and accessible selection labels. Search and page-size changes clear selections.
- DONE: Institutions adds name/place search, no-match feedback and an expandable onboarding form, with fetch/create/plan error feedback. Lead cards separate contact information and enquiry text; individual decisions refresh the queue and report failures.
- VERIFIED: Admin production build, Prettier check and git diff whitespace checks pass. Existing bundle-size warning remains. Authenticated browser inspected all five routes; live listings and populated users render. Institution search/no-match and onboarding disclosure verified; redemption institution selector exercised. All five routes and expanded onboarding fit 390px without page overflow.
- LIMITATION: Lead queue was empty; record-changing actions were not submitted during design verification.

### Admin system/account pages and mobile header — 2026-09-08

- DONE: Business rules, Feature flags, Audit log, Profile and Settings adopt shared admin surfaces and typography. Rules have a persistent save bar; flags have enabled counts, accessible controls and mutation-error feedback. Audit filters have accessible labels; timeline entries stack on mobile with wrapping identifiers.
- DONE: Profile has improved avatar contrast, responsive upload controls and upload-aware saving. Settings has icon/title/description navigation with responsive tab orientation and linked tab panels.
- DONE: Admin mobile header separates the full page title from branding and compact action controls; navigation trigger has an accessible label.
- VERIFIED: Admin TypeScript/Vite build and diff whitespace checks pass. Browser inspected all five routes at 390px with no page overflow, settings/preferences at 320px, navigation drawer and audit table toggle. No rules, flag or account mutations submitted.
- CATEGORY: Existing RewardsProfile category implementation contains icons, titles and descriptions in all eight options and selected values. Live reinspection was blocked by partner sign-in; no authentication bypass attempted.
- Existing large-bundle build warning remains. Temporary viewport restored.
