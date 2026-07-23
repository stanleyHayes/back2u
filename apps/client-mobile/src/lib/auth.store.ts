import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserDTO } from '@back2u/shared-types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  set: (input: { user: UserDTO; accessToken: string; refreshToken: string }) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      set: (input) =>
        set({ user: input.user, accessToken: input.accessToken, refreshToken: input.refreshToken }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'back2u.auth', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
