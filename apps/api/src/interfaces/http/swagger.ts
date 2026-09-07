import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import swaggerUi from 'swagger-ui-express';
import type { Request, Response } from 'express';

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'bak2me API',
    description: 'bak2me REST API documentation. Built with Express + Zod.',
    version: getVersion(),
    contact: { name: 'bak2me Support' },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Items', description: 'Lost & found items' },
    { name: 'Matches', description: 'Item match suggestions & decisions' },
    { name: 'Chat', description: 'Messaging between users' },
    { name: 'Tags', description: 'QR tag management & scanning' },
    { name: 'Courier', description: 'Courier job lifecycle' },
    { name: 'Marketplace', description: 'Auctions & bids for unclaimed items' },
    { name: 'Users', description: 'User management (admin)' },
    { name: 'Admin', description: 'Admin dashboards & moderation' },
    { name: 'Partner', description: 'Partner institution stats' },
    { name: 'BakPoints', description: "A member's own points ledger and Trust Score" },
    {
      name: 'Trust & Safety',
      description:
        'Held recoveries, the editable economy and manual points adjustments. Admin only — ' +
        'these payloads carry the private Recovery Risk Scores and the weights behind them.',
    },
    { name: 'Recovery Points', description: 'Partner custody, staff and the chain of custody' },
    { name: 'Rewards marketplace', description: 'Partner-funded perks bought with BakPoints' },
    { name: 'Health', description: 'Health checks' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token. Use `Authorization: Bearer <token>`.',
      },
    },
    schemas: {
      ApiError: {
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
        required: ['error'],
      },
      GeoPoint: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['Point'] },
          coordinates: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 2,
            example: [-0.186964, 5.603717],
          },
        },
        required: ['type', 'coordinates'],
      },
      PlaceRef: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          point: { $ref: '#/components/schemas/GeoPoint' },
        },
        required: ['name', 'point'],
      },
      ItemImage: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          publicId: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
        },
        required: ['url', 'publicId'],
      },
      UserDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          phone: { type: 'string' },
          avatarUrl: { type: 'string', format: 'uri' },
          roles: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'user',
                'finder',
                'trusted_finder',
                'courier',
                'partner_admin',
                'admin',
                'super_admin',
              ],
            },
          },
          status: { type: 'string', enum: ['active', 'banned', 'suspended'] },
          reputationScore: { type: 'integer' },
          pointsBalance: { type: 'integer' },
          successfulReturns: { type: 'integer' },
          averageRating: { type: 'number' },
          reviewCount: { type: 'integer' },
          emailVerified: { type: 'boolean' },
          phoneVerified: { type: 'boolean' },
          trustedFinder: { type: 'boolean' },
          institutionId: { type: 'string' },
          locale: { type: 'string', enum: ['en', 'fr', 'tw', 'ga', 'ee'] },
          badges: { type: 'array', items: { type: 'string' } },
          pushTokens: { type: 'array', items: { type: 'string' } },
          emailPreferences: {
            type: 'object',
            properties: {
              marketing: { type: 'boolean' },
              matches: { type: 'boolean' },
              chat: { type: 'boolean' },
              reminders: { type: 'boolean' },
              courier: { type: 'boolean' },
            },
            required: ['marketing', 'matches', 'chat', 'reminders', 'courier'],
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'email',
          'name',
          'roles',
          'reputationScore',
          'pointsBalance',
          'emailVerified',
          'emailPreferences',
          'createdAt',
        ],
      },
      ItemDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['lost', 'found'] },
          classification: { type: 'string', enum: ['lost', 'stolen'] },
          status: {
            type: 'string',
            enum: [
              'open',
              'matched',
              'claimed',
              'returned',
              'closed',
              'archived',
              'auctioned',
              'donated',
            ],
          },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { $ref: '#/components/schemas/ItemImage' } },
          place: { $ref: '#/components/schemas/PlaceRef' },
          occurredAt: { type: 'string', format: 'date-time' },
          postedById: { type: 'string' },
          rewardId: { type: 'string' },
          institutionId: { type: 'string' },
          qrTagCode: { type: 'string' },
          serialNumber: { type: 'string' },
          imei: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          bumpedAt: { type: 'string', format: 'date-time' },
          flaggedForReview: { type: 'boolean' },
          bookmarkCount: { type: 'integer' },
        },
        required: [
          'id',
          'kind',
          'classification',
          'status',
          'title',
          'description',
          'category',
          'tags',
          'images',
          'place',
          'occurredAt',
          'postedById',
          'createdAt',
          'updatedAt',
        ],
      },
      MatchDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          lostItemId: { type: 'string' },
          foundItemId: { type: 'string' },
          score: { type: 'number' },
          imageScore: { type: 'number' },
          textScore: { type: 'number' },
          geoScore: { type: 'number' },
          timeScore: { type: 'number' },
          status: { type: 'string', enum: ['suggested', 'accepted', 'rejected', 'verified'] },
          returnConfirmedByLost: { type: 'string' },
          returnConfirmedByFound: { type: 'string' },
          returnedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'lostItemId',
          'foundItemId',
          'score',
          'imageScore',
          'textScore',
          'geoScore',
          'timeScore',
          'status',
          'createdAt',
        ],
      },
      ChatMessageDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          threadId: { type: 'string' },
          authorId: { type: 'string' },
          body: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          flagged: { type: 'boolean' },
          readBy: { type: 'array', items: { type: 'string' } },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: { url: { type: 'string', format: 'uri' } },
              required: ['url'],
            },
          },
        },
        required: ['id', 'threadId', 'authorId', 'body', 'createdAt'],
      },
      ChatThreadDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          itemId: { type: 'string' },
          matchId: { type: 'string' },
          participantIds: { type: 'array', items: { type: 'string' } },
          lastMessageAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'itemId', 'participantIds', 'lastMessageAt', 'createdAt'],
      },
      QrTagDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          ownerId: { type: 'string' },
          itemLabel: { type: 'string' },
          status: { type: 'string', enum: ['unclaimed', 'active', 'lost', 'disabled'] },
          lastSeenAt: { type: 'string', format: 'date-time' },
          lastSeenAt_point: { $ref: '#/components/schemas/GeoPoint' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'code', 'status', 'createdAt'],
      },
      CourierJobDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          itemId: { type: 'string' },
          pickup: { $ref: '#/components/schemas/PlaceRef' },
          dropoff: { $ref: '#/components/schemas/PlaceRef' },
          fee: { type: 'integer' },
          currency: { type: 'string' },
          status: {
            type: 'string',
            enum: ['requested', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
          },
          riderId: { type: 'string' },
          requesterId: { type: 'string' },
          pickupCode: { type: 'string' },
          deliveryCode: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          estimatedDistanceKm: { type: 'number' },
          estimatedDurationMin: { type: 'number' },
        },
        required: [
          'id',
          'itemId',
          'pickup',
          'dropoff',
          'fee',
          'currency',
          'status',
          'requesterId',
          'pickupCode',
          'deliveryCode',
          'createdAt',
          'updatedAt',
        ],
      },
      MarketplaceListingDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          itemId: { type: 'string' },
          startingPrice: { type: 'integer' },
          currency: { type: 'string' },
          buyNowPrice: { type: 'integer' },
          closesAt: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['pending', 'live', 'sold', 'donated', 'withdrawn', 'cancelled'],
          },
          highBidId: { type: 'string' },
          charityRecipient: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'itemId', 'startingPrice', 'currency', 'closesAt', 'status', 'createdAt'],
      },
      BidDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          listingId: { type: 'string' },
          bidderId: { type: 'string' },
          amount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'listingId', 'bidderId', 'amount', 'createdAt'],
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          accessTokenExpiresAt: { type: 'string', format: 'date-time' },
        },
        required: ['accessToken', 'refreshToken', 'accessTokenExpiresAt'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/UserDTO' },
          tokens: { $ref: '#/components/schemas/AuthTokens' },
        },
        required: ['user', 'tokens'],
      },
      PaginatedItems: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/ItemDTO' } },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
        },
        required: ['items', 'page', 'pageSize', 'total'],
      },
      AdminStatsDTO: {
        type: 'object',
        properties: {
          users: { type: 'integer' },
          itemsByStatus: { type: 'object', additionalProperties: { type: 'integer' } },
          itemsTotal: { type: 'integer' },
          marketplaceListings: { type: 'integer' },
          marketplaceBids: { type: 'integer' },
          institutions: { type: 'integer' },
          courierJobs: { type: 'integer' },
          matchesTotal: { type: 'integer' },
          matchesAccepted: { type: 'integer' },
          matchSuccessRate: { type: 'number' },
          usersPerDay: { type: 'array', items: { type: 'integer' } },
          itemsPerDay: { type: 'array', items: { type: 'integer' } },
          matchesPerDay: { type: 'array', items: { type: 'integer' } },
        },
        required: [
          'users',
          'itemsByStatus',
          'itemsTotal',
          'marketplaceListings',
          'marketplaceBids',
          'institutions',
          'courierJobs',
          'matchesTotal',
          'matchesAccepted',
          'matchSuccessRate',
          'usersPerDay',
          'itemsPerDay',
          'matchesPerDay',
        ],
      },
      PartnerStatsDTO: {
        type: 'object',
        properties: {
          totalItems: { type: 'integer' },
          openItems: { type: 'integer' },
          matchedItems: { type: 'integer' },
          returnedItems: { type: 'integer' },
          itemsByStatus: { type: 'object', additionalProperties: { type: 'integer' } },
          totalRedemptions: { type: 'integer' },
          totalPointsRedeemed: { type: 'integer' },
          totalCourierJobs: { type: 'integer' },
          activeCourierJobs: { type: 'integer' },
          recentItems: { type: 'array', items: { $ref: '#/components/schemas/ItemDTO' } },
          recentRedemptions: { type: 'array', items: { type: 'object' } },
        },
        required: [
          'totalItems',
          'openItems',
          'matchedItems',
          'returnedItems',
          'itemsByStatus',
          'totalRedemptions',
          'totalPointsRedeemed',
          'totalCourierJobs',
          'activeCourierJobs',
          'recentItems',
          'recentRedemptions',
        ],
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          db: { type: 'string', enum: ['connected', 'disconnected'] },
          redis: { type: 'string', enum: ['connected', 'disconnected', 'disabled'] },
          version: { type: 'string' },
        },
        required: ['status', 'db', 'redis', 'version'],
      },
    },
  },
  paths: {
    // ── Points, Trust & Safety, Recovery Points and rewards marketplace ──
    '/v1/points/summary': {
      get: {
        tags: ['BakPoints'],
        summary: 'Get my BakPoints summary',
        description:
          "Returns the caller's own BakPoints totals: spendable balance, points still inside the " +
          'holding period, lifetime earned, lifetime reversed, and the amounts earned inside the ' +
          'rolling daily/weekly/monthly cap windows. The user id always comes from the bearer ' +
          "token, so there is no way to read another member's summary here. The balance is read " +
          'from the user record (the same number as UserDTO.pointsBalance) while the other figures ' +
          'are aggregated from the point ledger, and nothing from the risk engine is exposed — a ' +
          'reward held by a risk rule simply shows up inside `pending` with no explanation of which ' +
          'rule fired.',
        operationId: 'getMyPointsSummary',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'A PointsSummaryDTO: `balance` (spendable now), `pending` (earned but still in the ' +
              'holding period), `lifetimeEarned` (sum of every cleared credit), `reversed` (sum of ' +
              'every reversed credit), and `earnedToday` / `earnedThisWeek` / `earnedThisMonth` ' +
              '(pending + cleared inside each rolling cap window).',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'The user id in the token no longer resolves to a user record.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description:
              'Rate limited by the strict limiter applied to the whole /v1/points mount (100 requests ' +
              'per 15 minutes per key).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/points/ledger': {
      get: {
        tags: ['BakPoints'],
        summary: 'List my BakPoints ledger entries',
        description:
          "Returns a page of the caller's own immutable point ledger entries, newest first by " +
          'creation time, each carrying the signed `points` actually granted plus the `basePoints`, ' +
          '`multiplier` and the `reasons` array that explains how the award was arrived at. Scoped ' +
          'to the token subject only — there is no user parameter — and optionally narrowed to one ' +
          'lifecycle status. Pagination uses `page` and `pageSize` (default 20, hard maximum 100); ' +
          '`total` is the count of entries matching the same user and status filter, not the size ' +
          'of the page.',
        operationId: 'listMyPointLedger',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['pending', 'cleared', 'reversed', 'cancelled'] },
            description:
              'Restrict to one ledger lifecycle status. Omit for every entry. Any other value is rejected as a validation error.',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description:
              '1-based page number; anything below 1 or unparseable is clamped to 1. Defaults to 1.',
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Entries per page. Defaults to 20 and is clamped to the range 1-100.',
          },
        ],
        responses: {
          200: {
            description:
              '`{ entries, total }` where `entries` is an array of PointLedgerEntryDTO — id, userId, ' +
              'action, signed points, basePoints, multiplier, status, reasons and createdAt are always ' +
              'present, while verificationLevel, caseRef, itemId, counterpartyId, pendingUntil, ' +
              'clearedAt, reversedAt and resolutionNote appear only when set — and `total` is the ' +
              'number of entries matching the user and status filter across all pages.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              '`status` is present but is not one of pending, cleared, reversed, cancelled (zod parse ' +
              'failure, code `validation`).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description:
              'Rate limited by the strict limiter applied to the whole /v1/points mount (100 requests ' +
              'per 15 minutes per key).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/points/trust': {
      get: {
        tags: ['BakPoints'],
        summary: 'Get my Trust Score with full breakdown',
        description:
          "Returns the caller's own Trust Score together with the full component breakdown, so they " +
          'can see exactly what would raise it. The score is RECOMPUTED on every read from current ' +
          'facts — verification flags, account age, ledger-derived recovery counts, review rating, ' +
          'confirmed-fraud findings inside the last 365 days, reversals, and partner custody ' +
          'integrity when the user is partner staff — rather than being read from a stored running ' +
          'total; trust measures reliability and is deliberately not a tally of activity the way ' +
          'BakPoints are. The recompute writes the resulting score and level back onto the user ' +
          'record as a side effect of this GET, which is also what the public endpoint later ' +
          'serves.',
        operationId: 'getMyTrustScore',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'A TrustScoreDTO: `userId`, `score` (0-100), `level`, optional `nextLevel` and ' +
              '`nextLevelRequirement` describing what is still missing to climb, `components` (each ' +
              'with key, label, 0-1 value, weight and a plain-English detail across ' +
              'identity_confidence, recovery_history, verification_quality, account_integrity, ' +
              'community_history and partner_integrity), and `computedAt` as an ISO timestamp of this ' +
              'recompute.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'The user id in the token no longer resolves to a user record.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description:
              'Rate limited by the strict limiter applied to the whole /v1/points mount (100 requests ' +
              'per 15 minutes per key).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/points/trust/{userId}': {
      get: {
        tags: ['BakPoints'],
        summary: "Get another member's public trust standing",
        description:
          "Returns another member's headline trust standing — level and score only. The component " +
          'breakdown is deliberately withheld: it names the individual signals behind the number, ' +
          "and publishing them would tell a bad actor which lever to pull, so only the owner's own " +
          "/v1/points/trust includes them. Unlike the owner's endpoint this does not recompute; it " +
          'reads the score and level stored on the user record by the last recompute, so it can lag ' +
          "until that user's own trust is recalculated. Any authenticated caller may read any user " +
          'id — no role or relationship is required — but a bearer token is still mandatory.',
        operationId: 'getPublicTrustScore',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Id of the user whose public trust standing is being read.',
          },
        ],
        responses: {
          200: {
            description:
              'A PublicTrustDTO: `userId`, `level` (new_finder, helper, trusted_finder, community_hero, ' +
              'guardian or legend) and `score` (0-100). No component breakdown, next-level hint or ' +
              'computedAt timestamp.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No user exists with the given userId.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description:
              'Rate limited by the strict limiter applied to the whole /v1/points mount (100 requests ' +
              'per 15 minutes per key).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/business-rules': {
      get: {
        tags: ['Trust & Safety'],
        summary: 'Get the platform business rules',
        description:
          'Returns the single stored business-rules document (id `singleton`) that drives the whole ' +
          'BakPoints economy: base points per action, category bonuses, holding periods, rolling ' +
          'caps, verification multipliers, anti-collusion penalties, new-account delays and the ' +
          'risk-band thresholds. Admin and super_admin only — these are the rule weights sitting ' +
          'behind the private Recovery Risk Score and must never be served to users or partners on ' +
          'any other surface. There is no 404 path: if the document has never been written, the ' +
          'repository seeds and persists the spec defaults on first read and returns those.',
        operationId: 'getBusinessRules',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'A BusinessRulesDTO: pointsPerAction (keyed by PointAction), categoryBonus (keyed by ' +
              'category slug), pointsPendingDays, riskExtendedPendingDays, dailyPointCap, ' +
              'weeklyPointCap, monthlyPointCap, verificationMultipliers (peer, recovery_point, ' +
              'verified_delivery, institutional), repeatPairFreeCount, repeatPairPenalty, ' +
              'diminishingReturnsAfter, diminishingReturnsFactor, newAccountMinAgeDays, ' +
              'newAccountRewardDelayDays, highValueThresholdMinor, riskThresholds (mediumFrom, ' +
              'highFrom, criticalFrom), rewardPlatformFeeRate, campaignMultiplier, optional ' +
              'campaignStartsAt/campaignEndsAt, plus updatedAt and updatedBy.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      patch: {
        tags: ['Trust & Safety'],
        summary: 'Retune the platform business rules',
        description:
          'Patches the singleton business-rules document field by field: only the keys you send ' +
          'change, and the nested groups (pointsPerAction, categoryBonus, verificationMultipliers, ' +
          'riskThresholds) merge over the stored values rather than replacing them, so a one-action ' +
          'retune leaves every other knob intact. The body is strict at every level — an unknown ' +
          'top-level key, or a misspelled action name inside pointsPerAction, is rejected with 422 ' +
          "instead of being silently stripped, and an empty body is rejected as 'No changes " +
          "supplied'. The domain re-validates on top of the schema: riskThresholds must strictly " +
          'increase (mediumFrom < highFrom < criticalFrom) and campaignStartsAt must precede ' +
          'campaignEndsAt, both 422; a rejected edit leaves the stored rules untouched. Every ' +
          'accepted change is written to the audit log as businessRules.update with the full before ' +
          'and after documents and the list of changed keys. Note that ' +
          'campaignStartsAt/campaignEndsAt accept null but the route maps null to undefined, so ' +
          'sending null is accepted and simply leaves the existing campaign window in place.',
        operationId: 'updateBusinessRules',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  pointsPerAction: {
                    type: 'object',
                    description:
                      'Partial map of base points per action. Keys are restricted to the known PointAction values (profile_completed, found_item_reported, recovery_point_deposit, recovery_ordinary, recovery_document, recovery_device, owner_confirmed_recovery, milestone_bonus, fraud_penalty, redemption_spend, admin_adjustment); each value is an integer 0–100000. Unknown keys are rejected, not ignored. Merges over the stored map.',
                  },
                  categoryBonus: {
                    type: 'object',
                    description:
                      'Flat extra points per item-category slug. Slugs are free-form strings; each value is an integer 0–100000. Merges over the stored map, so an existing slug can be retuned but not removed here.',
                  },
                  pointsPendingDays: {
                    type: 'integer',
                    description: 'Days a credit stays pending before it can clear. 0–365.',
                  },
                  riskExtendedPendingDays: {
                    type: 'integer',
                    description:
                      'Extra pending days applied when the risk engine returns extend_hold. 0–365.',
                  },
                  dailyPointCap: {
                    type: 'integer',
                    description:
                      'Rolling daily earning cap; 0 disables the cap. Minimum 0, and the domain additionally caps it at 1000000.',
                  },
                  weeklyPointCap: {
                    type: 'integer',
                    description:
                      'Rolling weekly earning cap; 0 disables the cap. Minimum 0, domain maximum 1000000.',
                  },
                  monthlyPointCap: {
                    type: 'integer',
                    description:
                      'Rolling monthly earning cap; 0 disables the cap. Minimum 0, domain maximum 1000000.',
                  },
                  verificationMultipliers: {
                    type: 'object',
                    description:
                      'Partial map of reward weighting per evidence path. Only the keys peer, recovery_point, verified_delivery and institutional are accepted; each value is 0–10. Merges over the stored map.',
                  },
                  repeatPairFreeCount: {
                    type: 'integer',
                    description:
                      'Recoveries with the same counterparty that are exempt from the repeat-pair penalty. Minimum 0, domain maximum 1000.',
                  },
                  repeatPairPenalty: {
                    type: 'number',
                    description:
                      'Multiplier applied per repeat recovery beyond the free count. 0–1.',
                  },
                  diminishingReturnsAfter: {
                    type: 'integer',
                    description:
                      'Recoveries in a rolling 30 days before diminishing returns kick in. Minimum 0, domain maximum 10000.',
                  },
                  diminishingReturnsFactor: {
                    type: 'number',
                    description: 'Multiplier applied once past diminishingReturnsAfter. 0–1.',
                  },
                  newAccountMinAgeDays: {
                    type: 'integer',
                    description:
                      'Accounts younger than this have their rewards held longer. 0–365.',
                  },
                  newAccountRewardDelayDays: {
                    type: 'integer',
                    description: "Extra pending days applied to a new account's rewards. 0–365.",
                  },
                  highValueThresholdMinor: {
                    type: 'integer',
                    description:
                      'Item value in minor currency units above which enhanced verification applies. Minimum 0, domain maximum 1000000000.',
                  },
                  riskThresholds: {
                    type: 'object',
                    description:
                      'Partial object of the lower bound of each risk band: mediumFrom, highFrom, criticalFrom, each an integer 1–100. Merges over the stored thresholds, and the merged result must strictly increase or the whole patch is rejected.',
                  },
                  rewardPlatformFeeRate: {
                    type: 'number',
                    description: 'Platform fee taken from an owner-funded cash reward. 0–1.',
                  },
                  campaignMultiplier: {
                    type: 'number',
                    description:
                      'Temporary partner- or sponsor-funded boost applied across all awards. 0–10.',
                  },
                  campaignStartsAt: {
                    type: 'string',
                    description:
                      'ISO 8601 datetime the campaign multiplier starts applying. Nullable in the schema, but a null is turned into undefined by the route and therefore leaves the stored value unchanged.',
                  },
                  campaignEndsAt: {
                    type: 'string',
                    description:
                      'ISO 8601 datetime the campaign multiplier stops applying. Must be after campaignStartsAt. Nullable in the schema, but a null leaves the stored value unchanged.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'The complete BusinessRulesDTO after the merge, with updatedAt refreshed and updatedBy ' +
              "set to the calling admin's user id.",
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Schema rejection (unknown top-level key, unknown pointsPerAction key, value out of ' +
              'range, empty body) or a domain ValidationError such as non-increasing riskThresholds or ' +
              'campaignStartsAt after campaignEndsAt',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/risk': {
      get: {
        tags: ['Trust & Safety'],
        summary: 'List open risk assessments',
        description:
          "The Trust & Safety review queue: every risk assessment still in reviewStatus 'open', " +
          'sorted riskiest first (score descending, then newest first). Admin and super_admin only ' +
          "— each row carries the 0–100 Recovery Risk Score, the band, the engine's action and the " +
          'individual rule hits with their weights, and none of that may leave this surface. ' +
          'Paginated via page/pageSize; the response reports items plus the total count of open ' +
          'assessments, not the page number back.',
        operationId: 'listOpenRiskAssessments',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description:
              '1-based page number. Defaults to 1; values below 1 or unparseable are clamped to 1.',
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Assessments per page. Defaults to 20, clamped to the range 1–100.',
          },
        ],
        responses: {
          200: {
            description:
              'An object with `items` — an array of RiskAssessmentDTO (id, subjectId, ownerId, ' +
              'finderId, score, band, action, ruleHits with code/weight/detail, reviewStatus, optional ' +
              'reviewerId/reviewerNote, createdAt, optional decidedAt) — and `total`, the count of all ' +
              'open assessments.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/risk/{id}': {
      get: {
        tags: ['Trust & Safety'],
        summary: 'Get one risk assessment',
        description:
          'Returns a single risk assessment by id, in any review status — open, cleared, ' +
          'confirmed_fraud or dismissed. Admin and super_admin only: the payload includes the raw ' +
          'score and the deterministic rule hits with the weight each contributed, which the spec ' +
          'forbids exposing outside this surface. Use it to read the full anti-collusion picture on ' +
          'a recovery before deciding it.',
        operationId: 'getRiskAssessment',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Risk assessment id',
          },
        ],
        responses: {
          200: {
            description:
              'A RiskAssessmentDTO: id, subjectId (the recovery — a match id today), ownerId, finderId, ' +
              'score (0–100, higher is riskier), band, action (clear, extend_hold, manual_review or ' +
              'freeze), ruleHits, reviewStatus, reviewerId, reviewerNote, createdAt and decidedAt.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No risk assessment with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/risk/{id}/review': {
      post: {
        tags: ['Trust & Safety'],
        summary: 'Decide a risk assessment',
        description:
          'Closes an open risk assessment and, for a fraud finding, executes the whole clawback. A ' +
          'decision of `confirmed_fraud` reverses EVERY BakPoints ledger entry attached to that ' +
          'recovery (deducting already-credited points from the balances, which may go negative) ' +
          'and then applies the configured fraud penalty to BOTH participants — the finder and the ' +
          'owner — suspending each account, because the spec treats a manufactured recovery as a ' +
          'two-party act. The clawback runs before the review is closed, so a failure leaves the ' +
          'case open rather than releasing the payout block; a penalty that cannot be applied to ' +
          'one participant (an already-banned account, for example) is logged and does not stop the ' +
          'other. `cleared` and `dismissed` close the case without any reversal or penalty. Either ' +
          "way both participants' trust scores are recomputed immediately and the decision is " +
          'audit-logged with the score, band and note. Admin and super_admin only, and single-shot: ' +
          "an assessment that is no longer 'open' returns 409.",
        operationId: 'reviewRiskAssessment',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Risk assessment id to decide',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision'],
                properties: {
                  decision: {
                    type: 'string',
                    enum: ['cleared', 'confirmed_fraud', 'dismissed'],
                    description:
                      'The finding. `confirmed_fraud` triggers the full reversal-and-suspension path described above; `cleared` and `dismissed` close the case with no economic effect.',
                  },
                  note: {
                    type: 'string',
                    description:
                      "Reviewer note, up to 2000 characters, stored on the assessment and copied onto the audit log. On a confirmed_fraud decision it is also used as the reversal and penalty note; if omitted, a note of the form 'Confirmed fraudulent recovery <subjectId>' is generated for those.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'The updated RiskAssessmentDTO with reviewStatus set to the decision, reviewerId set to ' +
              'the calling admin, reviewerNote and decidedAt populated.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No risk assessment with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description:
              "The assessment has already been reviewed — its reviewStatus is no longer 'open'",
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body failed validation: missing or unrecognised decision, or a note longer than 2000 ' +
              'characters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/partners/{id}': {
      get: {
        tags: ['Trust & Safety'],
        summary: 'Get a partner trust summary',
        description:
          "Partner health for the Trust & Safety console: an institution's current tier and " +
          'standing alongside its custody throughput — total deposits, total releases, the ' +
          'releases-to-deposits ratio, how many items it is holding right now, and how many staff ' +
          'and Recovery Points it runs. A low ratio or a growing open-custody count is the signal ' +
          'that a partner needs watching. Admin and super_admin only. The path id is the ' +
          'institution id, not a location or staff id.',
        operationId: 'getPartnerTrustSummary',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Institution (partner) id',
          },
        ],
        responses: {
          200: {
            description:
              'A PartnerTrustSummaryDTO: institutionId, tier, trustStatus, deposits, releases, ' +
              'depositsToReturnsRatio (releases/deposits to 3 decimal places, or null when there are no ' +
              'deposits yet), openCustody, staffCount and locationCount.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No institution with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/partners/{id}/standing': {
      patch: {
        tags: ['Trust & Safety'],
        summary: "Set a partner's tier and trust standing",
        description:
          'Admin control over where a partner sits in the network and how much it is trusted. Send ' +
          'a tier, a trustStatus, or both — a body with neither is rejected with 422. Because the ' +
          'caller is an admin, the standing change is applied with admin authority, which is the ' +
          'only way a partner can be moved back down the severity ladder (suspended or reward_hold ' +
          'back to watchlist or active); automated escalation elsewhere can only increase severity. ' +
          'Setting a trustStatus to its current value is a no-op on the entity. Both the previous ' +
          'and new tier/status, plus the note, are written to the audit log as partner.setStanding.',
        operationId: 'setPartnerStanding',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Institution (partner) id',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tier: {
                    type: 'string',
                    enum: [
                      'community',
                      'recovery_point',
                      'verified_recovery_point',
                      'institutional',
                      'transport',
                      'logistics',
                      'reward',
                      'sponsor',
                      'government',
                    ],
                    description:
                      'New partner tier. Changing tier changes what the partner is allowed to do — only recovery_point, verified_recovery_point, institutional, transport and government may hold physical custody.',
                  },
                  trustStatus: {
                    type: 'string',
                    enum: ['active', 'watchlist', 'reward_hold', 'suspended'],
                    description:
                      "New standing. `reward_hold` freezes the partner's reward flow and `suspended` is the most severe; an admin may set any of these in either direction.",
                  },
                  note: {
                    type: 'string',
                    description:
                      'Reason for the change, up to 2000 characters. Stored on the institution as the trust-status note when trustStatus is supplied, and always recorded on the audit entry.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'A PartnerStandingDTO with institutionId, and the tier and trustStatus as they now stand.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No institution with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body supplied neither tier nor trustStatus, or a value was not one of the accepted enum ' +
              'members / the note exceeded 2000 characters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/points/adjust': {
      post: {
        tags: ['Trust & Safety'],
        summary: "Manually credit or debit a user's points",
        description:
          "Writes a deliberate admin credit or debit against a user's BakPoints balance as an " +
          '`admin_adjustment` ledger entry. The entry settles immediately rather than going through ' +
          'the holding period — an adjustment is a human decision, so there is nothing for the ' +
          "fraud hold to guard — and the user's balance moves in the same call. Points must be a " +
          'non-zero integer (positive credits, negative debits) and a non-blank note is mandatory; ' +
          'both are enforced in the use case as well as the schema, so a whitespace-only note is a ' +
          '422. The adjustment is audit-logged as points.adjust with the amount, note and resulting ' +
          'entry id. Admin and super_admin only.',
        operationId: 'adjustUserPoints',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'points', 'note'],
                properties: {
                  userId: {
                    type: 'string',
                    description:
                      'Id of the user whose balance is being adjusted. Must resolve to an existing user or the call 404s.',
                  },
                  points: {
                    type: 'integer',
                    description:
                      'Signed amount to apply. Positive credits the user, negative debits them. Must be a non-zero integer; zero is rejected with 422.',
                  },
                  note: {
                    type: 'string',
                    description:
                      "Why the adjustment was made, 1–2000 characters and not blank. Stored as the entry's resolution note and as its single award reason, so the user sees it verbatim on their ledger.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "The created PointLedgerEntryDTO: id, userId, action 'admin_adjustment', the signed " +
              "points, basePoints, multiplier, status, reasons (a single 'base' reason carrying the " +
              'note), resolutionNote and createdAt.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No user with that userId',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Schema rejection (missing userId, non-integer points, note absent or over 2000 ' +
              'characters) or a domain ValidationError for zero/non-integer points or a blank note',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/admin/trust/points/{id}/reverse': {
      post: {
        tags: ['Trust & Safety'],
        summary: 'Reverse a single points ledger entry',
        description:
          'Claws back one BakPoints ledger entry by id after confirmed fraud or a lost dispute. If ' +
          'the entry had already been credited to the balance, those points are deducted first and ' +
          'a `points:reversed` realtime event is pushed to the user; the deduction may legitimately ' +
          'push the balance negative, since forgiving the debt would reward the fraud. A pending ' +
          'entry never reached the balance, so only its status changes. The deduction deliberately ' +
          'runs before the entry is marked reversed, so a failure leaves the entry untouched and ' +
          'the call can simply be retried. This reverses exactly one entry — reversing a whole ' +
          'recovery is what confirming fraud on its risk assessment does. Admin and super_admin ' +
          'only, audit-logged as points.reverse, and not repeatable: an entry already reversed or ' +
          'cancelled returns 409.',
        operationId: 'reversePointLedgerEntry',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Point ledger entry id to reverse',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['note'],
                properties: {
                  note: {
                    type: 'string',
                    description:
                      "Why the entry is being reversed, 1–2000 characters. Required — it is stored as the entry's resolution note and recorded on the audit log.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "The updated PointLedgerEntryDTO with status 'reversed', reversedAt set and " +
              'resolutionNote carrying the supplied note.',
          },
          401: {
            description: 'Missing bearer token, or the access token is invalid or expired',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Authenticated caller does not hold the admin or super_admin role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No ledger entry with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description:
              'The entry has already been reversed, or it was cancelled and cannot be reversed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body failed validation: note missing, empty, or longer than 2000 characters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/locations': {
      get: {
        tags: ['Recovery Points'],
        summary: "List the organisation's Recovery Points",
        description:
          "Returns every Recovery Point counter belonging to the caller's own partner organisation, " +
          'active and closed alike, with no pagination. The organisation is taken from the ' +
          '`institutionId` claim on the access token and never from the URL, so a partner admin can ' +
          'only ever see their own counters. A token without an `institutionId` claim is rejected ' +
          'with 403 even when the role check passes.',
        operationId: 'listRecoveryPoints',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'An array of PartnerLocationDTO — `id`, `institutionId`, `name`, `place` (name, optional ' +
              'city/country, GeoJSON `point`), optional `storageDescription`, `active`, and `createdAt` ' +
              'as an ISO string.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller holds none of partner_admin/admin/super_admin, or the token is not linked to a ' +
              'partner organisation',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        tags: ['Recovery Points'],
        summary: 'Open a Recovery Point',
        description:
          "Creates a new physical counter for the caller's own organisation; the institution id " +
          "comes from the token, so a partner cannot open a counter under someone else's name. Only " +
          'partner tiers permitted to hold custody (recovery_point, verified_recovery_point, ' +
          'institutional, transport, government) may run a Recovery Point — any other tier is ' +
          'refused with 403 and the tier must be changed by an admin first. The new location is ' +
          'created active, and the write is recorded in the audit log as `partnerLocation.create`.',
        operationId: 'createRecoveryPoint',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'place'],
                properties: {
                  name: {
                    type: 'string',
                    description:
                      'Counter name, 2–160 characters. Trimmed before saving; a name that is only whitespace is rejected as a validation error.',
                  },
                  place: {
                    type: 'object',
                    description:
                      'Where the counter is. `name` (1–160) and `point` (a GeoJSON `{ type: "Point", coordinates: [lng, lat] }`) are required; `address` (max 300) and `city` (max 120) are optional. Any other key is stripped.',
                  },
                  storageDescription: {
                    type: 'string',
                    description:
                      'Free-text note on where items are physically kept behind the counter, max 500 characters. Partner-facing only.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "The created PartnerLocationDTO, with a generated `id`, the caller's `institutionId`, " +
              '`active: true` and `createdAt`.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              "Caller lacks the required role, the token carries no institution, or the partner's tier " +
              'is not permitted to run a Recovery Point',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'The institution on the token no longer exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body failed schema validation, or the location name is empty after trimming',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/locations/{id}': {
      delete: {
        tags: ['Recovery Points'],
        summary: 'Close a Recovery Point',
        description:
          'Deactivates a counter rather than deleting it — the row stays for history and the DTO ' +
          'comes back with `active: false`. A counter that still holds any item in `held` custody ' +
          'cannot be closed: the call fails with 403 naming the number of items, because closing it ' +
          'would strand that property with no staff authorised to release it, so transfer or ' +
          'release the items first. Closing a Recovery Point owned by another organisation is ' +
          'refused with 403 even though the id is valid.',
        operationId: 'deactivateRecoveryPoint',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              "Recovery Point (partner location) id. Must belong to the caller's organisation.",
          },
        ],
        responses: {
          200: { description: 'The deactivated PartnerLocationDTO with `active: false`.' },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks the required role, the token carries no institution, the Recovery Point ' +
              'belongs to another organisation, or it still holds items in custody',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No Recovery Point with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/locations/{id}/custody': {
      get: {
        tags: ['Recovery Points'],
        summary: 'List items held at a Recovery Point',
        description:
          "The shelf list for one counter, paged, with each custody record enriched with the item's " +
          'title. Beyond the organisation check, the caller must personally hold an active staff ' +
          'membership able to act at this location — a member pinned to a different counter gets ' +
          '403, because the records include the internal `storageBin`. Records come back ' +
          'newest-first (most recently accepted first) and the `total` is the unpaged count for the ' +
          'chosen status filter.',
        operationId: 'listCustodyAtRecoveryPoint',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              "Recovery Point (partner location) id. Must belong to the caller's organisation and the caller must be assigned to it.",
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: '1-based page number; anything below 1 or unparseable falls back to 1.',
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Records per page. Defaults to 25, clamped to a maximum of 100.',
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['held', 'released', 'transferred', 'disposed'] },
            description:
              'Restrict to one custody status. Omit for every record ever held at this counter.',
          },
        ],
        responses: {
          200: {
            description:
              '`{ records, total }` where each record is a CustodyRecordDTO plus an optional ' +
              '`itemTitle`: id, caseId, itemId, institutionId, locationId, depositedByUserId, ' +
              "acceptedByStaffId (the accepting staff member's user id), condition, declaredContents, " +
              'sealId, storageBin, intakePhotos, status, receiptCode, and the release fields once ' +
              'handed over. `total` is the full count matching the filter.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks the required role, the token carries no institution, the Recovery Point ' +
              'belongs to another organisation, or the caller is not active staff assigned to this ' +
              'counter',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No Recovery Point with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description: '`status` is not one of the four custody statuses',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/staff': {
      get: {
        tags: ['Recovery Points'],
        summary: 'List partner staff',
        description:
          "Returns every staff membership in the caller's own organisation, active and deactivated " +
          'alike, with no pagination. Each row is joined against the user record to add `userName` ' +
          'and `userEmail` for the partner console; those two fields are absent when the underlying ' +
          'user has been deleted. A membership with no `locationId` may act at every counter in the ' +
          'organisation.',
        operationId: 'listPartnerStaff',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'An array of PartnerStaffDTO — `id` (the membership id, not the user id), `userId`, ' +
              '`institutionId`, optional `locationId`, `role` (agent/supervisor/manager), `active`, ' +
              '`createdAt`, and the joined `userName`/`userEmail`.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller holds none of partner_admin/admin/super_admin, or the token is not linked to a ' +
              'partner organisation',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        tags: ['Recovery Points'],
        summary: 'Add a staff member',
        description:
          "Links an existing platform user to the caller's own organisation as counter staff — it " +
          'does not create an account, so the user must already be registered or the call 404s. ' +
          'Re-adding somebody who was previously removed reuses and reactivates their existing ' +
          'membership row rather than minting a new one (a unique userId+institutionId index would ' +
          'otherwise lock a returning member out permanently), so this is safely repeatable and ' +
          'does not fail with a duplicate conflict. Reactivating this way also overwrites the ' +
          'stored role and location, including clearing `locationId` back to organisation-wide when ' +
          'the field is omitted.',
        operationId: 'addPartnerStaff',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'role'],
                properties: {
                  userId: {
                    type: 'string',
                    description: 'Id of an existing platform user to enrol as staff.',
                  },
                  role: {
                    type: 'string',
                    enum: ['agent', 'supervisor', 'manager'],
                    description:
                      'Seniority inside this organisation. supervisor and manager may approve sensitive actions; this is a partner staff role, not a platform role.',
                  },
                  locationId: {
                    type: 'string',
                    description:
                      'Pin the member to one Recovery Point, which must belong to this organisation. Omit to let them act at every counter in the organisation.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              'The created or reactivated PartnerStaffDTO, with `active: true` and ' +
              '`userName`/`userEmail` filled in from the linked user.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: 'Caller lacks the required role, or the token carries no institution',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description:
              'The institution no longer exists, the user id is unknown, or `locationId` names a ' +
              'Recovery Point that does not exist or belongs to another organisation',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description: 'Body failed schema validation, e.g. an unrecognised role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/staff/{id}': {
      delete: {
        tags: ['Recovery Points'],
        summary: 'Remove a staff member',
        description:
          'Deactivates a staff membership rather than deleting it, so past custody events keep ' +
          'naming a real actor; the response comes back with `active: false`. The path takes the ' +
          'membership id (PartnerStaffDTO.id), not the user id, and a membership belonging to ' +
          'another organisation is refused with 403. The removed person can later be re-enrolled ' +
          'through POST /v1/custody/staff, which reuses this same row.',
        operationId: 'removePartnerStaff',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              "Partner staff membership id (PartnerStaffDTO.id), not the user id. Must belong to the caller's organisation.",
          },
        ],
        responses: {
          200: {
            description:
              'The deactivated PartnerStaffDTO with `active: false`. `userName` and `userEmail` are not ' +
              'populated on this response.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks the required role, the token carries no institution, or the membership ' +
              'belongs to another organisation',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No staff membership with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/custody': {
      post: {
        tags: ['Recovery Points'],
        summary: 'Take an item into custody',
        description:
          "Books a found item in at a Recovery Point: it opens (or reuses) the item's recovery " +
          'case, seals and records the item, writes a CUSTODY_ACCEPTED event onto the chain of ' +
          'custody, and awards deposit points to the finder immediately. The acting user must be ' +
          'active staff assigned to that counter at a partner whose tier permits custody and that ' +
          'is not suspended, and staff may not accept their own deposit — `depositedByUserId` equal ' +
          'to the caller is refused with 403. Only an item of kind `found` that is not already held ' +
          "can be deposited; the response is the finder's digital receipt, carrying the receipt " +
          'code and the generated seal id, and the finder is also notified in-app.',
        operationId: 'acceptCustody',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId', 'locationId', 'depositedByUserId', 'condition'],
                properties: {
                  itemId: {
                    type: 'string',
                    description:
                      'The found item being handed in. Must be an item of kind `found` with no active custody record.',
                  },
                  locationId: {
                    type: 'string',
                    description:
                      "The Recovery Point taking the item. Must be active, belong to the caller's organisation, and be one the caller is assigned to.",
                  },
                  depositedByUserId: {
                    type: 'string',
                    description:
                      'The finder handing the item over; they receive the points and the receipt notification. Must be an existing user and must not be the caller.',
                  },
                  condition: {
                    type: 'string',
                    enum: ['new', 'good', 'fair', 'poor', 'damaged'],
                    description: 'Physical condition recorded at intake.',
                  },
                  declaredContents: {
                    type: 'array',
                    description:
                      'What the finder declares is inside, up to 50 strings of at most 200 characters each. Defaults to an empty array.',
                  },
                  storageBin: {
                    type: 'string',
                    description:
                      'Internal shelf, bin or locker reference, max 80 characters. Partner-facing only, never shown publicly.',
                  },
                  intakePhotos: {
                    type: 'array',
                    description:
                      'Up to 12 photo URLs captured at intake; each entry must be a valid URL.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "A CustodyReceiptDTO — `caseId`, `custodyRecordId`, `itemId`, the finder's `receiptCode`, " +
              "the generated `sealId`, `locationName` (the institution's name) and `acceptedAt`. The " +
              "deposit raises the case's verification level to `institutional` for " +
              'institutional/government partners and `recovery_point` otherwise.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              "Caller lacks the required role or an institution; the partner's tier cannot hold custody " +
              'or the partner is suspended; the Recovery Point belongs to another organisation; the ' +
              'caller is not active staff assigned to it; or staff tried to accept their own deposit',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'Unknown institution, Recovery Point, item, or depositing user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description:
              'The Recovery Point is closed, the item is already in custody, or the recovery case ' +
              'cannot move to `deposited` from its current state',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description: 'Body failed schema validation, or the item is not a found item',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/custody/{id}/release-code': {
      post: {
        tags: ['Recovery Points'],
        summary: 'Issue a collection code to a claimant',
        description:
          'Mints a six-digit one-time code that authorises a handover and sends it to the claimant ' +
          '— by SMS when they have a verified phone, otherwise as an in-app notification, with SMS ' +
          'failure silently falling back to the notification. The code is never returned to the ' +
          'counter: staff must not be able to mint and read it themselves, since its whole purpose ' +
          'is proving the person at the desk is the account the platform verified. It is stored ' +
          'only as a peppered hash, expires 30 minutes after issue, and is refused unless an ' +
          'ownership verification for this exact claimant on this exact item is already approved; ' +
          're-issuing overwrites any live code and resets the attempt counter to zero.',
        operationId: 'issueReleaseCode',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: "Custody record id. Must be held by the caller's organisation.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['claimantId'],
                properties: {
                  claimantId: {
                    type: 'string',
                    description:
                      'The user collecting the item. An approved ownership verification naming this exact user for this item is required, and the code is bound to them — nobody else can redeem it.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              '`{ issued: true, sentTo: "sms" | "notification" }`. `sentTo` is `"sms"` only when the ' +
              'claimant has a verified phone and the send succeeded; the code itself is never in the ' +
              'response.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks the required role or an institution; the partner cannot hold custody or is ' +
              'suspended; the item is held by another organisation; the caller is not staff assigned to ' +
              'the holding counter; or ownership has not been verified for this claimant',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'Unknown custody record, institution, Recovery Point, or claimant',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description: 'The Recovery Point is closed, or the item is no longer in `held` custody',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description: 'Body failed schema validation (missing or empty `claimantId`)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/custody/{id}/release': {
      post: {
        tags: ['Recovery Points'],
        summary: 'Release an item to its owner',
        description:
          'Hands the item over at the counter. Every release control converges here: the item must ' +
          "be held by the caller's organisation, the caller must be active staff assigned to that " +
          'counter, an approved ownership verification for this exact claimant must exist, and the ' +
          'one-time code must be live, unexpired and issued to that same claimant — separation of ' +
          'duties also blocks a staff member releasing to themselves. Each attempt is counted and ' +
          'persisted even when it fails, so a wrong code is not free and the code burns after five ' +
          'attempts and must be re-issued; on success the case advances to `released` (moving ' +
          'through `ownership_verified` first if it had not got there), an ITEM_RELEASED event is ' +
          'appended, the item is marked claimed and the code is destroyed so it cannot be replayed.',
        operationId: 'releaseCustody',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              "Custody record id. Must be held by the caller's organisation and still in `held` status.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['claimantId', 'releaseCode'],
                properties: {
                  claimantId: {
                    type: 'string',
                    description:
                      'The verified claimant collecting the item. Must match both the approved ownership verification and the claimant the release code was issued to, and must not be the acting staff member.',
                  },
                  releaseCode: {
                    type: 'string',
                    description:
                      'The one-time code read out or scanned at the counter, 4–12 characters. Compared against a peppered hash; a wrong value consumes one of the five attempts.',
                  },
                  note: {
                    type: 'string',
                    description:
                      'Free-text handover note, max 500 characters. Stored on the custody record and copied onto the ITEM_RELEASED chain-of-custody event.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'The updated CustodyRecordDTO with `status: "released"`, `releasedToUserId`, ' +
              "`releasedByStaffId` (the releasing staff member's user id), `releasedAt` and " +
              '`releaseNote`, alongside the intake fields (condition, declaredContents, sealId, ' +
              'storageBin, intakePhotos, receiptCode).',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks the required role or an institution; the item is held by another ' +
              'organisation; the partner cannot hold custody or is suspended; the caller is not staff ' +
              'assigned to the counter; ownership is not verified for this claimant; or the code is ' +
              'wrong, expired, exhausted after five attempts, issued to a different claimant, or the ' +
              'staff member is releasing to themselves',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'Unknown custody record, institution or Recovery Point',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description:
              'The Recovery Point is closed, the item is no longer in `held` custody, no release code ' +
              'has been issued, or the recovery case refuses the transition to `released`',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body failed schema validation, e.g. a release code shorter than 4 or longer than 12 ' +
              'characters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/cases': {
      get: {
        tags: ['Recovery Points'],
        summary: "List the organisation's recovery cases",
        description:
          "The partner console's case queue, scoped to the caller's own organisation by the token's " +
          'institution id — a case only appears once a deposit has attached it to this partner. ' +
          "Cases come back newest-first by `openedAt`, each enriched with the found item's title " +
          'for display. Unlike the per-counter custody list there is no per-location staff check ' +
          'here, so any partner_admin for the organisation sees every case across all its counters.',
        operationId: 'listInstitutionRecoveryCases',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: '1-based page number; anything below 1 or unparseable falls back to 1.',
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Cases per page. Defaults to 25, clamped to a maximum of 100.',
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: [
                'found',
                'deposited',
                'matched',
                'claim_submitted',
                'ownership_verified',
                'released',
                'returned',
                'closed',
                'cancelled',
              ],
            },
            description:
              'Restrict to one case status. Omit for every case attached to the organisation.',
          },
        ],
        responses: {
          200: {
            description:
              '`{ cases, total }` where each case is a RecoveryCaseDTO plus an optional `itemTitle`: ' +
              'id, human-quotable `reference`, foundItemId, optional lostItemId/matchId/claimantId, ' +
              'finderId, status, verificationLevel, custodyRecordId, institutionId, locationId, ' +
              'openedAt, closedAt, updatedAt. `total` is the unpaged count for the filter.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller holds none of partner_admin/admin/super_admin, or the token is not linked to a ' +
              'partner organisation',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description: '`status` is not one of the nine recovery case statuses',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/custody/trust': {
      get: {
        tags: ['Recovery Points'],
        summary: "Get the organisation's trust summary",
        description:
          "Health signals for the caller's own partner organisation: current tier and trust " +
          'standing, lifetime deposit and release counts, the deposits-to-returns ratio, how many ' +
          'items are open in custody, and the counts of active staff and active Recovery Points. ' +
          '`deposits` counts every custody record ever created for the organisation whatever its ' +
          'status, `releases` only those now `released`, and the ratio is `releases / deposits` ' +
          'rounded to three decimals — `null` rather than zero when the partner has taken no ' +
          'deposits yet. Trust status progresses automatically under risk controls; only an admin ' +
          'can return a partner to `active`, and this endpoint is read-only.',
        operationId: 'getPartnerTrustSummary',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'A PartnerTrustSummaryDTO — `institutionId`, `tier`, `trustStatus` ' +
              '(active/watchlist/reward_hold/suspended), `deposits`, `releases`, ' +
              '`depositsToReturnsRatio` (number or null), `openCustody` (records still `held`), ' +
              '`staffCount` and `locationCount` (active memberships and active counters only).',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller holds none of partner_admin/admin/super_admin, or the token is not linked to a ' +
              'partner organisation',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'The institution on the token no longer exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Custody rate limit exceeded (600 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/recoveries/mine': {
      get: {
        tags: ['Recovery Points'],
        summary: 'List my recoveries',
        description:
          "Returns the signed-in user's own recovery cases, covering both the ones they found and " +
          'the ones they are claiming. Any authenticated user may call it; the user id comes from ' +
          "the token, so there is no way to ask for someone else's list. The result is capped at 50 " +
          'cases, ordered newest-first by `openedAt`, and takes no pagination or filter parameters; ' +
          'it returns case summaries only — use GET /v1/recoveries/{id} for the event history.',
        operationId: 'listMyRecoveryCases',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'An array of up to 50 RecoveryCaseDTO — id, `reference`, foundItemId, optional ' +
              'lostItemId/matchId/claimantId, finderId, status, verificationLevel, custodyRecordId, ' +
              'institutionId, locationId, openedAt, optional closedAt, updatedAt.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Strict rate limit exceeded (100 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/recoveries/{id}': {
      get: {
        tags: ['Recovery Points'],
        summary: 'Get a recovery case and its chain of custody',
        description:
          'Returns one case with its full ordered event history and, when a partner holds the item, ' +
          'the custody record. Access is deliberately narrow because the history names both parties ' +
          "and the partner's internal handling: platform admins and super_admins see any case, " +
          "everyone else must be the case's finder or claimant, or staff of the holding partner " +
          'cleared to act at that specific counter — staff pinned to a different location are ' +
          'refused. Anyone outside that set gets 403, not a filtered response, and the custody ' +
          'record (which carries the internal `storageBin`) is only attached after that check ' +
          'passes.',
        operationId: 'getRecoveryCase',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: "Recovery case id (the case's `id`, not its human-quotable `reference`).",
          },
        ],
        responses: {
          200: {
            description:
              'A RecoveryCaseDetailDTO: every RecoveryCaseDTO field plus `events` — the ordered ' +
              'RecoveryEventDTO history, sorted by ascending `sequence` (sequence, kind, actorId, ' +
              'actorStaffId, institutionId, locationId, evidence, note, correctsEventId, occurredAt) — ' +
              'and an optional `custody` CustodyRecordDTO when the case has one.',
          },
          401: {
            description: 'Missing, malformed or expired bearer token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              "Viewer is not the case's finder or claimant, not an admin, and not partner staff cleared " +
              'for the holding location',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No recovery case with that id',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Strict rate limit exceeded (100 requests per 15 minutes)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reward-catalog': {
      get: {
        tags: ['Rewards marketplace'],
        summary: 'Browse the rewards catalogue',
        description:
          'Returns the live, in-window partner-funded offers a member can spend BakPoints on, ' +
          'paginated. It works signed out via optionalAuth — an invalid or expired bearer token is ' +
          'silently treated as anonymous rather than rejected — but eligibility is only ' +
          'personalised for a signed-in member. Offer availability (status live, campaign window ' +
          'open, stock left) is resolved for everyone and yields both `eligible` and a ' +
          'human-readable `ineligibleReason` when it fails; only a signed-in caller additionally ' +
          'has trust level, points balance and per-user limit folded into that verdict. These are ' +
          'partner-funded perks, deliberately not a points-to-cash channel.',
        operationId: 'listRewardCatalog',
        security: [],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description:
              '1-based page number, via parsePagination. Anything unparseable or below 1 falls back to 1.',
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Offers per page. Defaults to 24 and is clamped to the range 1–60.',
          },
          {
            name: 'institutionId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description:
              "Restrict the catalogue to one partner organisation's offers. Ignored unless it is a string.",
          },
        ],
        responses: {
          200: {
            description:
              '`{ offers, total }` where `offers` is an array of RewardOfferListingDTO — the full ' +
              'RewardOfferDTO (id, institutionId, institutionName joined for display, title, ' +
              'description, category, imageUrl, pointsCost, status, totalInventory/remainingInventory ' +
              'which are null when unlimited, startsAt, endsAt, perUserLimit, minTrustLevel, ' +
              'reservationHours, termsUrl, createdAt, updatedAt) plus `eligible` and an optional ' +
              '`ineligibleReason` message. `total` is the count of live offers matching the filter, not ' +
              'the page length.',
          },
          429: {
            description:
              'Public rate limit exceeded — 300 requests per IP per 15 minutes across the ' +
              '/v1/reward-catalog mount.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reward-catalog/{id}/reserve': {
      post: {
        tags: ['Rewards marketplace'],
        summary: 'Reserve a catalogue reward',
        description:
          "Spends the member's BakPoints and takes one unit of stock immediately, holding both " +
          'until the partner confirms the returned 6-digit `code` at the counter; taking stock only ' +
          'at collection would let one unit be promised to several people. Stock is claimed first ' +
          'through an atomic conditional decrement, then points are debited and a ledger entry ' +
          'written — if the debit fails the unit is put back. The reservation lands as a `pending` ' +
          "redemption with `expiresAt` set to now plus the offer's `reservationHours`; an " +
          'uncollected one is later swept and returns both the points and the stock. Not ' +
          'idempotent: every call creates a new reservation and spends points again, bounded only ' +
          "by the offer's per-user limit. Because catalogue rewards are partner-funded perks and " +
          'not a cash conversion, the redemption carries `value: 0`.',
        operationId: 'reserveReward',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Id of the reward offer to reserve.',
          },
        ],
        responses: {
          201: {
            description:
              'A RedemptionDTO for the new reservation: id, userId, institutionId, institutionName, ' +
              "points (the offer's pointsCost), value 0, currency, the 6-digit `code`, status " +
              '`pending`, offerId, offerTitle, expiresAt and createdAt.',
          },
          401: {
            description: 'Missing bearer token, or a token that fails verification.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: "The member's trust level is below the offer's minTrustLevel.",
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description:
              'No offer with that id, or the authenticated user record no longer exists.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description:
              'Cannot reserve right now: offer not live, not yet started, campaign ended, fully claimed ' +
              '(including losing the race for the last unit at the atomic stock take), not enough ' +
              'BakPoints, or the per-user limit already reached.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Public rate limit exceeded — 300 requests per IP per 15 minutes.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reward-catalog/manage': {
      get: {
        tags: ['Rewards marketplace'],
        summary: "List the caller's partner reward offers",
        description:
          "Returns every reward offer belonging to the caller's own organisation in all statuses — " +
          "draft, live, paused and ended — which is the partner console's view rather than the " +
          'member-facing catalogue. The organisation comes from the `institutionId` claim on the ' +
          "caller's access token, never from a parameter, so a partner cannot read another " +
          "partner's catalogue. Unpaginated: the whole list comes back in one response " +
          'newest-first, and unlike the public catalogue these DTOs carry no `institutionName`.',
        operationId: 'listPartnerRewardOffers',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "An array of RewardOfferDTO for the caller's institution." },
          401: {
            description: 'Missing bearer token, or a token that fails verification.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks partner_admin/admin/super_admin, or the token carries no institutionId ' +
              '("Your account is not linked to a partner organisation").',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Public rate limit exceeded — 300 requests per IP per 15 minutes.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        tags: ['Rewards marketplace'],
        summary: 'Create a reward offer',
        description:
          "Creates a partner-funded offer under the caller's own organisation, taken from the " +
          "token's institutionId rather than the body. The offer is always created as `draft` " +
          'regardless of what is sent — `status` is not an accepted create field and the strict ' +
          'schema rejects it — so the partner can set inventory and dates before members can see ' +
          'it, then flip it live with a PATCH. Omitting `totalInventory` means unlimited stock, ' +
          'omitting `perUserLimit` means no cap, and `reservationHours` defaults to 72. The action ' +
          'is written to the audit log against the calling admin.',
        operationId: 'createRewardOffer',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category', 'pointsCost'],
                properties: {
                  title: {
                    type: 'string',
                    description:
                      'Display name, 2–120 characters. Trimmed, and rejected if it trims to empty.',
                  },
                  description: {
                    type: 'string',
                    description: 'What the member gets, 2–2000 characters. Trimmed.',
                  },
                  category: {
                    type: 'string',
                    enum: [
                      'mobile_data',
                      'ride_credit',
                      'delivery_discount',
                      'restaurant_voucher',
                      'retail_discount',
                      'event_perk',
                      'insurance_benefit',
                      'merchandise',
                    ],
                    description: 'Kind of partner-funded benefit.',
                  },
                  pointsCost: {
                    type: 'integer',
                    description:
                      'BakPoints a member spends to reserve one unit. Integer, 1–1000000.',
                  },
                  imageUrl: {
                    type: 'string',
                    description: 'Absolute URL of the offer artwork. Must parse as a URL.',
                  },
                  totalInventory: {
                    type: 'integer',
                    description:
                      'Units ever offered, integer 0–1000000; nullable. Omitted or null means unlimited stock, in which case remainingInventory comes back null too.',
                  },
                  startsAt: {
                    type: 'string',
                    description:
                      'ISO 8601 datetime the campaign opens. Must be strictly before endsAt when both are given.',
                  },
                  endsAt: {
                    type: 'string',
                    description:
                      'ISO 8601 datetime the campaign closes. After this the offer cannot be reserved.',
                  },
                  perUserLimit: {
                    type: 'integer',
                    description:
                      'How many one member may hold or have redeemed, integer 1–1000; nullable. Omitted or null means no per-member cap.',
                  },
                  minTrustLevel: {
                    type: 'string',
                    enum: [
                      'new_finder',
                      'helper',
                      'trusted_finder',
                      'community_hero',
                      'guardian',
                      'legend',
                    ],
                    description: 'Minimum community standing required to reserve.',
                  },
                  reservationHours: {
                    type: 'integer',
                    description:
                      'How long a reservation is held before it lapses back to the pool, integer 1–720. Defaults to 72.',
                  },
                  termsUrl: {
                    type: 'string',
                    description: "Absolute URL of the offer's terms. Must parse as a URL.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              'The created RewardOfferDTO, with `status` "draft", remainingInventory seeded from ' +
              'totalInventory, and institutionName filled in from the partner organisation.',
          },
          401: {
            description: 'Missing bearer token, or a token that fails verification.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks partner_admin/admin/super_admin, or the token carries no institutionId.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: "The institution on the caller's token no longer exists.",
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body failed the strict zod schema (missing or malformed field, or an unknown key such as ' +
              '`status`), or the domain rejected it — empty title, non-positive pointsCost, invalid ' +
              'dates, or a start not before the end.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Public rate limit exceeded — 300 requests per IP per 15 minutes.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reward-catalog/manage/{id}': {
      patch: {
        tags: ['Rewards marketplace'],
        summary: 'Update a reward offer',
        description:
          "Partially updates one of the caller's own offers and is the only way to move it between " +
          'draft, live, paused and ended; the offer is rejected outright if it belongs to another ' +
          'organisation. Every field is optional but the strict schema rejects unknown keys and an ' +
          'empty body. Inventory edits are applied as a delta, not a reset: raising totalInventory ' +
          'releases exactly the units added and setting it to null clears the cap back to ' +
          'unlimited, while lowering it below what members have already claimed is refused. An ' +
          '`ended` campaign cannot be reopened. Before and after snapshots plus the changed keys ' +
          'are written to the audit log.',
        operationId: 'updateRewardOffer',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              "Id of the reward offer to update. It must belong to the caller's institution.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description:
                      'Display name, 2–120 characters. Trimmed, and rejected if it trims to empty.',
                  },
                  description: {
                    type: 'string',
                    description: 'What the member gets, 2–2000 characters. Trimmed.',
                  },
                  category: {
                    type: 'string',
                    enum: [
                      'mobile_data',
                      'ride_credit',
                      'delivery_discount',
                      'restaurant_voucher',
                      'retail_discount',
                      'event_perk',
                      'insurance_benefit',
                      'merchandise',
                    ],
                    description: 'Kind of partner-funded benefit.',
                  },
                  pointsCost: {
                    type: 'integer',
                    description: 'BakPoints per unit. Integer, 1–1000000.',
                  },
                  imageUrl: {
                    type: 'string',
                    description:
                      'Absolute URL of the offer artwork. Must parse as a URL; an empty string is rejected with 422, so artwork cannot be cleared through this endpoint.',
                  },
                  totalInventory: {
                    type: 'integer',
                    description:
                      'New unit cap, integer 0–1000000, or null to clear the cap back to unlimited. Remaining stock moves by the same delta, and a value below the number already claimed is rejected.',
                  },
                  startsAt: {
                    type: 'string',
                    description:
                      'ISO 8601 datetime the campaign opens. Supplying either window bound re-validates the pair against the stored one.',
                  },
                  endsAt: {
                    type: 'string',
                    description:
                      'ISO 8601 datetime the campaign closes. Must be strictly after startsAt.',
                  },
                  perUserLimit: {
                    type: 'integer',
                    description: 'Per-member cap, integer 1–1000, or null to remove the cap.',
                  },
                  minTrustLevel: {
                    type: 'string',
                    enum: [
                      'new_finder',
                      'helper',
                      'trusted_finder',
                      'community_hero',
                      'guardian',
                      'legend',
                    ],
                    description: 'Minimum community standing required to reserve.',
                  },
                  reservationHours: {
                    type: 'integer',
                    description: 'How long a reservation is held, integer 1–720.',
                  },
                  termsUrl: {
                    type: 'string',
                    description:
                      "Absolute URL of the offer's terms. Must parse as a URL; an empty string is rejected with 422, so the terms link cannot be cleared through this endpoint.",
                  },
                  status: {
                    type: 'string',
                    enum: ['draft', 'live', 'paused', 'ended'],
                    description:
                      'Lifecycle state. This is how a draft is published; once `ended` it cannot be moved back to anything else.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'The updated RewardOfferDTO. It is built without the institution join, so ' +
              '`institutionName` is absent here.',
          },
          401: {
            description: 'Missing bearer token, or a token that fails verification.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks partner_admin/admin/super_admin, the token carries no institutionId, or the ' +
              'offer belongs to another organisation.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'No offer with that id.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description: 'An ended campaign cannot be reopened.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          422: {
            description:
              'Body failed the strict zod schema (unknown key, bad field, an empty-string imageUrl or ' +
              'termsUrl, or no changes supplied), or the domain rejected it — empty title, non-positive ' +
              'pointsCost, invalid dates, a start not before the end, or inventory set below the units ' +
              'already claimed.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Public rate limit exceeded — 300 requests per IP per 15 minutes.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reward-catalog/manage/analytics': {
      get: {
        tags: ['Rewards marketplace'],
        summary: 'Get partner reward redemption analytics',
        description:
          "Redemption analytics for the partner console, scoped to the organisation on the caller's " +
          'token and covering every offer it owns in all statuses. Per offer it reports live ' +
          'counters by redemption state — reserved (`pending`), redeemed (`fulfilled`), expired and ' +
          'reversed — alongside remaining inventory and pointsSpent, which counts only points on ' +
          'fulfilled redemptions rather than everything reserved. `collectionRate` is redeemed ÷ ' +
          '(redeemed + expired) rounded to three decimals and is deliberately null until something ' +
          'has actually settled, so a freshly opened campaign is not reported at 0%.',
        operationId: 'getPartnerRewardAnalytics',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              'A PartnerRewardAnalyticsDTO: institutionId, liveOffers, totalReserved, totalRedeemed, ' +
              'totalPointsSpent, and `offers` — one RewardOfferStatsDTO per offer with offerId, title, ' +
              'status, pointsCost, remainingInventory (null when unlimited), reserved, redeemed, ' +
              'expired, reversed, pointsSpent and collectionRate.',
          },
          401: {
            description: 'Missing bearer token, or a token that fails verification.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description:
              'Caller lacks partner_admin/admin/super_admin, or the token carries no institutionId ' +
              '("Your account is not linked to a partner organisation").',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: {
            description: 'Public rate limit exceeded — 300 requests per IP per 15 minutes.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } },
            },
          },
          '503': {
            description: 'Service is degraded',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } },
            },
          },
        },
      },
    },
    '/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8, maxLength: 128 },
                  name: { type: 'string', minLength: 1, maxLength: 120 },
                  phone: { type: 'string' },
                },
                required: ['email', 'password', 'name'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 1 },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        operationId: 'refreshToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', minLength: 10 },
                },
                required: ['refreshToken'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'New tokens',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '401': {
            description: 'Invalid or expired refresh token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        operationId: 'getMe',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/UserDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/items': {
      get: {
        tags: ['Items'],
        summary: 'List items',
        operationId: 'listItems',
        parameters: [
          { name: 'kind', in: 'query', schema: { type: 'string', enum: ['lost', 'found'] } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'open',
                'matched',
                'claimed',
                'returned',
                'closed',
                'archived',
                'auctioned',
                'donated',
              ],
            },
          },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'text', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'postedById', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'lng', in: 'query', schema: { type: 'number' } },
          { name: 'lat', in: 'query', schema: { type: 'number' } },
          {
            name: 'radius',
            in: 'query',
            schema: { type: 'integer', description: 'Radius in meters' },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of items',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PaginatedItems' } },
            },
          },
        },
      },
      post: {
        tags: ['Items'],
        summary: 'Create an item',
        operationId: 'createItem',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  kind: { type: 'string', enum: ['lost', 'found'] },
                  classification: { type: 'string', enum: ['lost', 'stolen'], default: 'lost' },
                  title: { type: 'string', minLength: 2, maxLength: 120 },
                  description: { type: 'string', minLength: 2, maxLength: 2000 },
                  category: { type: 'string', minLength: 2, maxLength: 60 },
                  tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
                  images: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ItemImage' },
                    minItems: 1,
                    maxItems: 8,
                  },
                  place: { $ref: '#/components/schemas/PlaceRef' },
                  occurredAt: { type: 'string', format: 'date-time' },
                  rewardAmount: { type: 'integer', minimum: 0 },
                  institutionId: { type: 'string' },
                },
                required: [
                  'kind',
                  'title',
                  'description',
                  'category',
                  'images',
                  'place',
                  'occurredAt',
                ],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item created',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ItemDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/items/{id}': {
      get: {
        tags: ['Items'],
        summary: 'Get item by ID',
        operationId: 'getItem',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Item details',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ItemDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '404': {
            description: 'Item not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
      patch: {
        tags: ['Items'],
        summary: 'Update an item',
        operationId: 'updateItem',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 2, maxLength: 120 },
                  description: { type: 'string', minLength: 2, maxLength: 2000 },
                  category: { type: 'string', minLength: 2, maxLength: 60 },
                  tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
                  classification: { type: 'string', enum: ['lost', 'stolen'] },
                  status: {
                    type: 'string',
                    enum: ['open', 'matched', 'claimed', 'returned', 'closed', 'archived'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item updated',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ItemDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '404': {
            description: 'Item not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/items/{id}/matches': {
      get: {
        tags: ['Items'],
        summary: 'List matches for an item',
        operationId: 'listItemMatches',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'List of matches',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/MatchDTO' } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/matches/{id}/accept': {
      post: {
        tags: ['Matches'],
        summary: 'Accept a match',
        operationId: 'acceptMatch',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Match accepted',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/MatchDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '404': {
            description: 'Match not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/matches/{id}/reject': {
      post: {
        tags: ['Matches'],
        summary: 'Reject a match',
        operationId: 'rejectMatch',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Match rejected',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/MatchDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/matches/{id}/confirm-return': {
      post: {
        tags: ['Matches'],
        summary: 'Confirm item return',
        operationId: 'confirmReturn',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Return confirmed',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/MatchDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/chat/threads': {
      get: {
        tags: ['Chat'],
        summary: 'List chat threads for current user',
        operationId: 'listThreads',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of threads',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/ChatThreadDTO' } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/chat/threads/{id}/messages': {
      get: {
        tags: ['Chat'],
        summary: 'Get messages in a thread',
        operationId: 'getMessages',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'List of messages',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/ChatMessageDTO' } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Chat'],
        summary: 'Send a message',
        operationId: 'sendMessage',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  body: { type: 'string', maxLength: 2000 },
                  images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: { url: { type: 'string', format: 'uri' } },
                      required: ['url'],
                    },
                    maxItems: 3,
                  },
                },
                required: ['body'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Message sent',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ChatMessageDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/tags/{code}': {
      get: {
        tags: ['Tags'],
        summary: 'Get QR tag by code',
        operationId: 'getTagByCode',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Tag details',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/QrTagDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '404': {
            description: 'Tag not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/v1/tags/{code}/scan': {
      post: {
        tags: ['Tags'],
        summary: 'Scan a QR tag',
        operationId: 'scanTag',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  finderMessage: { type: 'string', minLength: 1, maxLength: 800 },
                  finderEmail: { type: 'string', format: 'email' },
                },
                required: ['finderMessage'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Scan recorded',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/v1/tags/mine': {
      get: {
        tags: ['Tags'],
        summary: 'List my QR tags',
        operationId: 'listMyTags',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of tags',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/QrTagDTO' } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/courier/jobs': {
      post: {
        tags: ['Courier'],
        summary: 'Request a courier job',
        operationId: 'requestCourierJob',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  itemId: { type: 'string' },
                  pickup: { $ref: '#/components/schemas/PlaceRef' },
                  dropoff: { $ref: '#/components/schemas/PlaceRef' },
                  fee: { type: 'integer', minimum: 0 },
                },
                required: ['itemId', 'pickup', 'dropoff', 'fee'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Job created',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/CourierJobDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/courier/jobs/open': {
      get: {
        tags: ['Courier'],
        summary: 'List open courier jobs',
        operationId: 'listOpenJobs',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'lng', in: 'query', schema: { type: 'number' } },
          { name: 'lat', in: 'query', schema: { type: 'number' } },
          {
            name: 'radius',
            in: 'query',
            schema: { type: 'integer', description: 'Radius in meters' },
          },
        ],
        responses: {
          '200': {
            description: 'List of open jobs',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/CourierJobDTO' } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/courier/jobs/{id}/accept': {
      post: {
        tags: ['Courier'],
        summary: 'Accept a courier job',
        operationId: 'acceptCourierJob',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Job accepted',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/CourierJobDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/courier/jobs/{id}/transition': {
      post: {
        tags: ['Courier'],
        summary: 'Transition courier job state',
        operationId: 'transitionCourierJob',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  transition: {
                    type: 'string',
                    enum: ['pickup', 'in_transit', 'deliver', 'cancel'],
                  },
                  code: { type: 'string', description: 'Pickup or delivery code' },
                },
                required: ['transition'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'State transitioned',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/CourierJobDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/marketplace': {
      get: {
        tags: ['Marketplace'],
        summary: 'List live marketplace listings',
        operationId: 'listMarketplace',
        responses: {
          '200': {
            description: 'List of listings',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MarketplaceListingDTO' },
                    },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/marketplace/{id}': {
      get: {
        tags: ['Marketplace'],
        summary: 'Get marketplace listing by ID',
        operationId: 'getMarketplaceListing',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Listing with bids',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        listing: { $ref: '#/components/schemas/MarketplaceListingDTO' },
                        bids: { type: 'array', items: { $ref: '#/components/schemas/BidDTO' } },
                      },
                      required: ['listing', 'bids'],
                    },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/marketplace/{id}/bids': {
      post: {
        tags: ['Marketplace'],
        summary: 'Place a bid',
        operationId: 'placeBid',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'integer', minimum: 1 },
                },
                required: ['amount'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Bid placed',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/BidDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin)',
        operationId: 'listUsers',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Paginated users',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        items: { type: 'array', items: { $ref: '#/components/schemas/UserDTO' } },
                        page: { type: 'integer' },
                        pageSize: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                      required: ['items', 'page', 'pageSize', 'total'],
                    },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/users/{id}/status': {
      patch: {
        tags: ['Users'],
        summary: 'Update user status (admin)',
        operationId: 'updateUserStatus',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['active', 'banned', 'suspended'] },
                  reason: { type: 'string' },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/UserDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard stats',
        operationId: 'getAdminStats',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin stats',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/AdminStatsDTO' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/admin/flagged-items': {
      get: {
        tags: ['Admin'],
        summary: 'List flagged items',
        operationId: 'listFlaggedItems',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }],
        responses: {
          '200': {
            description: 'Flagged items',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/ItemDTO' } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/admin/flagged-items/{id}/clear': {
      post: {
        tags: ['Admin'],
        summary: 'Clear review flag from item',
        operationId: 'clearItemFlag',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Flag cleared',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'object', properties: { success: { type: 'boolean' } } },
                  },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
    '/v1/partner/stats': {
      get: {
        tags: ['Partner'],
        summary: 'Get partner stats',
        operationId: 'getPartnerStats',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Partner stats',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/PartnerStatsDTO' } },
                  required: ['data'],
                },
              },
            },
          },
          '403': {
            description: 'User not linked to an institution',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
  },
} as const;

export function swaggerUiHandler() {
  return swaggerUi.setup(openApiSpec as unknown as swaggerUi.JsonObject, {
    customSiteTitle: 'bak2me API Docs',
    explorer: true,
  });
}

export function swaggerUiAssets() {
  return swaggerUi.serve;
}

export function swaggerJsonHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiSpec);
}
