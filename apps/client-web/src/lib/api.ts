import { Back2uClient } from '@back2u/api-client';

import { useAuth } from './auth.store.js';
import { disconnectSocket } from './socket.js';

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

/** Revoke the server-side refresh token (best effort), then clear local session. */
export async function signOut() {
  const { refreshToken, clear } = useAuth.getState();
  try {
    if (refreshToken) await api.logout(refreshToken);
  } catch {
    // revocation is best-effort; always clear locally
  }
  disconnectSocket();
  clear();
}
