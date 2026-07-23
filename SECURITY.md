# Security policy

Please report vulnerabilities privately to **security@back2u.app**. Do not open a public issue.

We aim to acknowledge within 48 hours and resolve critical issues within 14 days.

## Scope

In scope: backend API (`apps/api`), web apps, mobile app, deployment configuration.

Out of scope: third-party providers (OpenAI, Cloudinary, Mapbox, Twilio, Hubtel, Resend, Sentry).

## Hardening already in place

- Argon2id password hashing
- Rotating server-stored refresh tokens with revocation
- Idempotency middleware on mutating routes
- Twilio webhook signature verification (HMAC-SHA1)
- Helmet CSP + CORS allowlist + preview-domain regex
- libsodium XChaCha20-Poly1305 encryption for vault sensitive fields
- Audit logging on privileged actions
- Per-IP rate limiting

## Responsible disclosure

We will credit researchers who report valid issues unless they prefer otherwise.
