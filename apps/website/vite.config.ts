import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));

// Read VITE_* vars from the monorepo-root .env regardless of the cwd the dev
// server is launched from — otherwise the public map can't find VITE_MAPBOX_TOKEN.
export default defineConfig({
  plugins: [react()],
  envDir: resolve(here, '../..'),
  server: { port: 5176 },
});
