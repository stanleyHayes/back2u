/**
 * Set process.env defaults so tests can build the DI container without
 * exiting on missing secrets. Imported once from each test file that needs
 * the container.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '0';
process.env.API_PUBLIC_URL = 'http://localhost';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-min-16-chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-16-chars';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '30d';
process.env.MONGO_URI = process.env.MONGO_URI ?? 'placeholder';
process.env.CORS_ORIGINS = 'http://localhost:5173';
// Keep all provider keys blank → adapters fall back to no-ops.
