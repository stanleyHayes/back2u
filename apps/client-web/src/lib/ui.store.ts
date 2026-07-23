import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@back2u/ui-web';

interface UiState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    { name: 'back2u.client.ui' },
  ),
);
