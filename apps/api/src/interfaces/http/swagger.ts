import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import swaggerUi from 'swagger-ui-express';
import type { Request, Response } from 'express';

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { version?: string };
    return pkg.version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Back2u API',
    description: 'Back2u REST API documentation. Built with Express + Zod.',
    version: getVersion(),
    contact: { name: 'Back2u Support' },
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
              enum: ['user', 'finder', 'trusted_finder', 'courier', 'partner_admin', 'admin', 'super_admin'],
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
        required: ['id', 'email', 'name', 'roles', 'reputationScore', 'pointsBalance', 'emailVerified', 'emailPreferences', 'createdAt'],
      },
      ItemDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['lost', 'found'] },
          classification: { type: 'string', enum: ['lost', 'stolen'] },
          status: {
            type: 'string',
            enum: ['open', 'matched', 'claimed', 'returned', 'closed', 'archived', 'auctioned', 'donated'],
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
        required: ['id', 'kind', 'classification', 'status', 'title', 'description', 'category', 'tags', 'images', 'place', 'occurredAt', 'postedById', 'createdAt', 'updatedAt'],
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
        required: ['id', 'lostItemId', 'foundItemId', 'score', 'imageScore', 'textScore', 'geoScore', 'timeScore', 'status', 'createdAt'],
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
          images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string', format: 'uri' } }, required: ['url'] } },
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
        required: ['id', 'itemId', 'pickup', 'dropoff', 'fee', 'currency', 'status', 'requesterId', 'pickupCode', 'deliveryCode', 'createdAt', 'updatedAt'],
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
        required: ['users', 'itemsByStatus', 'itemsTotal', 'marketplaceListings', 'marketplaceBids', 'institutions', 'courierJobs', 'matchesTotal', 'matchesAccepted', 'matchSuccessRate', 'usersPerDay', 'itemsPerDay', 'matchesPerDay'],
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
        required: ['totalItems', 'openItems', 'matchedItems', 'returnedItems', 'itemsByStatus', 'totalRedemptions', 'totalPointsRedeemed', 'totalCourierJobs', 'activeCourierJobs', 'recentItems', 'recentRedemptions'],
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
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } } },
          },
          '503': {
            description: 'Service is degraded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } } },
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
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
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
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
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
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/UserDTO' } }, required: ['data'] } } },
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
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['open', 'matched', 'claimed', 'returned', 'closed', 'archived', 'auctioned', 'donated'] } },
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
          { name: 'radius', in: 'query', schema: { type: 'integer', description: 'Radius in meters' } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of items',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedItems' } } },
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
                  images: { type: 'array', items: { $ref: '#/components/schemas/ItemImage' }, minItems: 1, maxItems: 8 },
                  place: { $ref: '#/components/schemas/PlaceRef' },
                  occurredAt: { type: 'string', format: 'date-time' },
                  rewardAmount: { type: 'integer', minimum: 0 },
                  institutionId: { type: 'string' },
                },
                required: ['kind', 'title', 'description', 'category', 'images', 'place', 'occurredAt'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item created',
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/ItemDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/ItemDTO' } }, required: ['data'] } } },
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
                  status: { type: 'string', enum: ['open', 'matched', 'claimed', 'returned', 'closed', 'archived'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item updated',
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/ItemDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/MatchDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/MatchDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/MatchDTO' } }, required: ['data'] } } },
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
                  images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string', format: 'uri' } }, required: ['url'] }, maxItems: 3 },
                },
                required: ['body'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Message sent',
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/ChatMessageDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/QrTagDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/CourierJobDTO' } }, required: ['data'] } } },
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
          { name: 'radius', in: 'query', schema: { type: 'integer', description: 'Radius in meters' } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/CourierJobDTO' } }, required: ['data'] } } },
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
                  transition: { type: 'string', enum: ['pickup', 'in_transit', 'deliver', 'cancel'] },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/CourierJobDTO' } }, required: ['data'] } } },
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
                    data: { type: 'array', items: { $ref: '#/components/schemas/MarketplaceListingDTO' } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/BidDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/UserDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/AdminStatsDTO' } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } }, required: ['data'] } } },
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
            content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/PartnerStatsDTO' } }, required: ['data'] } } },
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
    customSiteTitle: 'Back2u API Docs',
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
