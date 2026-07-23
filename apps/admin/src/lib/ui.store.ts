import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConsoleThemeMode } from '@back2u/ui-web';

interface UiState {
  themeMode: ConsoleThemeMode;
  sidebarCollapsed: boolean;
  /** Open/closed state per sidebar group heading (default open). */
  navGroupsOpen: Record<string, boolean>;
  /** User ids that have completed (or skipped) the first-login tour. */
  tourDone: Record<string, boolean>;
  tourOpen: boolean;
  setThemeMode: (mode: ConsoleThemeMode) => void;
  toggleSidebar: () => void;
  toggleNavGroup: (heading: string) => void;
  markTourDone: (userId: string) => void;
  setTourOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      sidebarCollapsed: false,
      navGroupsOpen: {},
      tourDone: {},
      tourOpen: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleNavGroup: (heading) =>
        set((s) => ({
          navGroupsOpen: { ...s.navGroupsOpen, [heading]: !(s.navGroupsOpen[heading] ?? true) },
        })),
      markTourDone: (userId) => set((s) => ({ tourDone: { ...s.tourDone, [userId]: true } })),
      setTourOpen: (tourOpen) => set({ tourOpen }),
    }),
    {
      name: 'back2u.admin.ui',
      partialize: (s) => ({
        themeMode: s.themeMode,
        sidebarCollapsed: s.sidebarCollapsed,
        navGroupsOpen: s.navGroupsOpen,
        tourDone: s.tourDone,
      }),
    },
  ),
);
