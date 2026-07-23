import type { UserDTO } from '@back2u/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  set: (i: { user: UserDTO; accessToken: string; refreshToken: string }) => void;
  /** Replaces the cached user (e.g. after a profile/MFA change) keeping tokens. */
  updateUser: (user: UserDTO) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      set: (i) => set({ user: i.user, accessToken: i.accessToken, refreshToken: i.refreshToken }),
      updateUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'back2u.partner.auth' },
  ),
);
