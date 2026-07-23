import { Back2uClient } from '@back2u/api-client';

import { useAuth } from './auth.store.js';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

if (__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[back2u] EXPO_PUBLIC_API_URL is not set — defaulting to http://localhost:4000, which is the phone itself on physical devices. Set EXPO_PUBLIC_API_URL to your machine\'s LAN IP (e.g. http://192.168.1.10:4000).',
  );
}

export const api = new Back2uClient({
  baseUrl,
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
  clear();
}
