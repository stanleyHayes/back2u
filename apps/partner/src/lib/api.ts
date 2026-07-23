import { Back2uClient } from '@back2u/api-client';

import { useAuth } from './auth.store.js';

export const api = new Back2uClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  getAccessToken: () => useAuth.getState().accessToken,
  getRefreshToken: () => useAuth.getState().refreshToken,
  onRefreshed: ({ accessToken, refreshToken }) => {
    const user = useAuth.getState().user;
    if (user) useAuth.getState().set({ user, accessToken, refreshToken });
  },
  onUnauthorized: () => useAuth.getState().clear(),
});
