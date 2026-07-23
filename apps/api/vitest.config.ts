import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/test/**/*.test.ts'],
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Each integration file spawns its own mongod (mongodb-memory-server);
    // unbounded parallelism (one worker per file) can exhaust the machine and
    // freeze all workers long enough to trip the 30s test timeout.
    maxWorkers: '50%',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/domain/**', 'src/application/**'],
      exclude: ['src/**/*.spec.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});
