/**
 * Hand-curated OpenAPI 3.1 spec covering the public API surface.
 * Kept hand-rolled (vs auto-generated) so the contract is reviewable in PRs
 * and not silently destabilised by a refactor.
 */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Back2u API',
    version: '1.0.0',
    description: 'Smart Lost & Found API. All responses are `{ data: T }`. Errors are `{ error: { code, message, details? } }`.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
            required: ['code', 'message'],
          },
        },
      },
    },
  },
  security: [{ bearer: [] }],
  paths: {
    '/health': { get: { summary: 'Health check', responses: { 200: { description: 'OK' } } } },
    '/v1/auth/register': {
      post: {
        summary: 'Register',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'name'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, name: { type: 'string' }, phone: { type: 'string' } } } } } },
        responses: { 201: { description: 'Created' }, 409: { description: 'Email in use' } },
      },
    },
    '/v1/auth/login': { post: { summary: 'Login', security: [] } },
    '/v1/auth/refresh': { post: { summary: 'Rotate refresh token', security: [] } },
    '/v1/auth/logout': { post: { summary: 'Logout (revoke refresh token)', security: [] } },
    '/v1/auth/phone/request-otp': { post: { summary: 'Request phone OTP' } },
    '/v1/auth/phone/verify': { post: { summary: 'Verify phone OTP' } },
    '/v1/auth/email/request-verification': { post: { summary: 'Request email verification' } },
    '/v1/auth/email/confirm': { post: { summary: 'Confirm email verification' } },
    '/v1/auth/password/request-reset': { post: { summary: 'Request password reset', security: [] } },
    '/v1/auth/password/confirm': { post: { summary: 'Confirm password reset', security: [] } },
    '/v1/me/push-token': { post: { summary: 'Register Expo push token' } },
    '/v1/me/locale': { post: { summary: 'Set locale' } },
    '/v1/me/redeem': { post: { summary: 'Redeem points' } },
    '/v1/me/export': { get: { summary: 'Export user profile (lite)' } },
    '/v1/account/export': { get: { summary: 'Comprehensive GDPR export (full)' } },
    '/v1/account': { delete: { summary: 'Delete account (PII anonymisation)' } },
    '/v1/items': {
      get: { summary: 'List items', security: [] },
      post: { summary: 'Create item' },
    },
    '/v1/items/{id}': {
      get: { summary: 'Get item', security: [] },
      patch: { summary: 'Update item' },
    },
    '/v1/items/{id}/matches': { get: { summary: 'List AI-suggested matches for an item' } },
    '/v1/items/{id}/bump': { post: { summary: 'Bump item expiry' } },
    '/v1/items/autocomplete': { get: { summary: 'Autocomplete cities & categories', security: [] } },
    '/v1/matches/{id}/accept': { post: { summary: 'Accept a match (opens chat thread)' } },
    '/v1/matches/{id}/reject': { post: { summary: 'Reject a match' } },
    '/v1/chat/threads': { get: { summary: 'List my threads' } },
    '/v1/chat/threads/{id}/messages': {
      get: { summary: 'List messages' },
      post: { summary: 'Post a message (verification-gated, PII-redacted)' },
    },
    '/v1/rewards/{id}/release': { post: { summary: 'Release reward to finder' } },
    '/v1/uploads/signature': { post: { summary: 'Cloudinary upload signature' } },
    '/v1/tags/mine': { get: { summary: 'List my QR tags' } },
    '/v1/tags/mint': { post: { summary: 'Mint blank QR tags (admin)' } },
    '/v1/tags/claim': { post: { summary: 'Claim a QR tag by code' } },
    '/v1/tags/{code}/scan': { post: { summary: 'Anonymous finder contact for a scanned tag', security: [] } },
    '/v1/tags/heartbeat': { post: { summary: 'Crowdsourced BLE/QR heartbeat', security: [] } },
    '/v1/tags/{code}/lost': { post: { summary: 'Mark a tagged item lost' } },
    '/v1/verifications': { post: { summary: 'Submit ownership-verification claim' } },
    '/v1/verifications/questions': { get: { summary: 'Standard verification questions', security: [] } },
    '/v1/verifications/pending': { get: { summary: 'Pending verifications (admin)' } },
    '/v1/verifications/{id}/decide': { post: { summary: 'Approve / reject (admin)' } },
    '/v1/courier/jobs': { post: { summary: 'Request a courier job' } },
    '/v1/courier/jobs/open': { get: { summary: 'List open jobs (courier role)' } },
    '/v1/courier/jobs/{id}/accept': { post: { summary: 'Accept job (courier role)' } },
    '/v1/courier/jobs/{id}/transition': { post: { summary: 'pickup / in_transit / deliver / cancel' } },
    '/v1/vault': {
      get: { summary: 'List my vault entries (decrypted server-side)' },
      post: { summary: 'Create vault entry (sensitive fields encrypted)' },
    },
    '/v1/vault/{id}': { delete: { summary: 'Delete vault entry' } },
    '/v1/zones': {
      get: { summary: 'List zone subscriptions' },
      post: { summary: 'Create zone subscription' },
    },
    '/v1/zones/{id}': { delete: { summary: 'Delete zone subscription' } },
    '/v1/marketplace': {
      get: { summary: 'List live auction listings', security: [] },
      post: { summary: 'List unclaimed item as auction (admin)' },
    },
    '/v1/marketplace/{id}/bids': { post: { summary: 'Place a bid' } },
    '/v1/police/items/{itemId}/report': { post: { summary: 'Generate stolen-item PDF' } },
    '/v1/police/cases/{id}/file': { post: { summary: 'Record case number / station' } },
    '/v1/institutions': {
      get: { summary: 'List institutions', security: [] },
      post: { summary: 'Onboard institution (admin)' },
    },
    '/v1/institutions/{id}': { get: { summary: 'Get institution', security: [] } },
    '/v1/leaderboard': { get: { summary: 'Top finders', security: [] } },
    '/v1/share/items/{id}/share-card': { get: { summary: 'Social share card', security: [] } },
    '/v1/sms/inbound': { post: { summary: 'Twilio inbound webhook (signature-verified)', security: [] } },
    '/v1/audit': { get: { summary: 'Audit log (admin)' } },
    '/v1/safety/blocks': {
      get: { summary: 'List my blocks' },
      post: { summary: 'Block a user' },
    },
    '/v1/safety/blocks/{blockedId}': { delete: { summary: 'Unblock' } },
    '/v1/safety/reports': {
      get: { summary: 'Open reports queue (admin)' },
      post: { summary: 'File a report' },
    },
    '/v1/safety/reports/{id}/decide': { post: { summary: 'Action / dismiss (admin)' } },
    '/v1/web-push/key': { get: { summary: 'VAPID public key', security: [] } },
    '/v1/web-push/subscribe': { post: { summary: 'Register browser push subscription' } },
    '/v1/web-push/unsubscribe': { post: { summary: 'Unregister browser push subscription' } },
    '/v1/notifications': { get: { summary: 'List notifications' } },
    '/v1/notifications/{id}/read': { post: { summary: 'Mark notification read' } },
    '/v1/notifications/read-all': { post: { summary: 'Mark all notifications read' } },
    '/v1/bookmarks': {
      get: { summary: 'List bookmarks' },
      post: { summary: 'Bookmark an item' },
    },
    '/v1/bookmarks/{id}': { delete: { summary: 'Remove bookmark' } },
    '/partner/v1/items': {
      get: { summary: 'List institution items (partner API)', security: [{ apiKey: [] }] },
      post: { summary: 'Report found item (partner API)', security: [{ apiKey: [] }] },
    },
    '/partner/v1/items/{id}': {
      get: { summary: 'Get item details (partner API)', security: [{ apiKey: [] }] },
    },
    '/partner/v1/items/{id}/status': {
      patch: { summary: 'Update item status (partner API)', security: [{ apiKey: [] }] },
    },
    '/partner/v1/stats': {
      get: { summary: 'Institution stats (partner API)', security: [{ apiKey: [] }] },
    },
    '/v1/admin/partner-api-keys': {
      get: { summary: 'List partner API keys (admin)' },
      post: { summary: 'Create partner API key (admin)' },
    },
    '/v1/admin/partner-api-keys/{id}': {
      delete: { summary: 'Revoke partner API key (admin)' },
    },
  },
} as const;
