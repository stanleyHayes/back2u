import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Load VITE_* vars from the monorepo root .env (where they live).
  envDir: '../../',
  server: { port: 5173 },
});
