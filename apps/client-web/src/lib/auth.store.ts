import type { FeatureFlagWithStatusDTO, UserDTO } from '@back2u/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  featureFlags: FeatureFlagWithStatusDTO[];
  set: (input: { user: UserDTO; accessToken: string; refreshToken: string }) => void;
  setUser: (user: UserDTO) => void;
  setFeatureFlags: (flags: FeatureFlagWithStatusDTO[]) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      featureFlags: [],
      set: (input) =>
        set({
          user: input.user,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
        }),
      setUser: (user) => set({ user }),
      setFeatureFlags: (flags) => set({ featureFlags: flags }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null, featureFlags: [] }),
    }),
    { name: 'back2u.auth' },
  ),
);
