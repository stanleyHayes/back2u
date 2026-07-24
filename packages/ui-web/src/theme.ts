import { createTheme, type ThemeOptions } from '@mui/material/styles';

const baseTokens: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: '#40614A' }, // teal — recovery / trust
    secondary: { main: '#8B6F4E' }, // amber — reward / found
    error: { main: '#DC2626' },
    background: { default: '#F2EFEA', paper: '#FFFFFF' },
  },
  // Near-square by default: cards, inputs, menus get a small radius. Buttons
  // and nav pills opt back into fully-rounded via their own overrides / sx.
  shape: { borderRadius: 4 },
  typography: {
    // Brand body face: Outfit. Headings use the Black Ops One display face.
    fontFamily: '"Outfit", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Black Ops One", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Black Ops One", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: '"Black Ops One", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Black Ops One", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    // Global keyframes + a subtle motion baseline, shared by every app.
    MuiCssBaseline: {
      styleOverrides: {
        '@keyframes b2uFadeUp': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'none' },
        },
        '@keyframes b2uFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        '@keyframes b2uPop': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*': { animationDuration: '0.001ms !important', animationIterationCount: '1 !important' },
        },
      },
    },
    // Buttons stay pill-rounded — the one element (with the nav) allowed to be —
    // and get a tactile press.
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: 'transform .12s ease, box-shadow .2s ease, background-color .2s ease',
          '&:active': { transform: 'scale(0.97)' },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .2s ease' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform .12s ease, background-color .2s ease, color .2s ease',
          '&:active': { transform: 'scale(0.9)' },
        },
      },
    },
  },
};

/** Entrance animation for a block; stagger with `fadeUpDelay(i)`. */
export const fadeUp = {
  animation: 'b2uFadeUp .5s cubic-bezier(.2,.7,.2,1) both',
} as const;

export const fadeUpDelay = (index: number, step = 60) => ({
  animation: 'b2uFadeUp .5s cubic-bezier(.2,.7,.2,1) both',
  animationDelay: `${index * step}ms`,
});

export const makeTheme = (overrides?: ThemeOptions) => createTheme({ ...baseTokens, ...overrides });

export const back2uTheme = makeTheme();

export type ThemeMode = 'light' | 'dark' | 'system';
export type ConsoleThemeMode = ThemeMode;

/**
 * Mode-aware theme for the customer-facing client app. Light keeps the warm
 * default; dark is a deep forest-green ground that stays on the green brand.
 */
export const makeClientTheme = (mode: 'light' | 'dark') =>
  mode === 'dark'
    ? makeTheme({
        palette: {
          mode: 'dark',
          primary: { main: '#A8B5A0' },
          secondary: { main: '#8B6F4E' },
          error: { main: '#F87171' },
          background: { default: '#1C231B', paper: '#263026' },
          divider: 'rgba(210,232,222,0.10)',
          text: { primary: '#EAF3ED', secondary: 'rgba(210,232,222,0.66)' },
        },
      })
    : back2uTheme;

/** Header/nav pill background for AppShell, per mode. */
export const clientHeaderBg = (dark: boolean) =>
  dark ? 'rgba(20,32,27,0.86)' : 'rgba(242,239,234,0.88)';

/**
 * Shared "ink" surfaces for the admin & partner consoles. Deep forest-green
 * (not blue) to match the Back2u brand — the sidebar/topbar stay dark in both
 * light and dark mode, so these are exported for the layouts to reuse.
 */
export const CONSOLE_INK = {
  /** Deepest surface: sidebar + collapsed rail. */
  panel: '#161C15',
  /** Translucent topbar in dark mode. */
  topbarDark: 'rgba(28,35,27,0.82)',
  /** Solid topbar in light mode (stays dark green). */
  topbarLight: '#223226',
} as const;

/**
 * Mode-aware theme for the admin & partner consoles. The sidebar/topbar keep
 * their dark forest-green panels in both modes; this palette drives the
 * content area.
 */
export const makeConsoleTheme = (mode: 'light' | 'dark') =>
  makeTheme({
    shape: { borderRadius: 4 },
    palette:
      mode === 'dark'
        ? {
            mode: 'dark',
            primary: { main: '#A8B5A0' },
            secondary: { main: '#8B6F4E' },
            background: { default: '#1C231B', paper: '#263026' },
            divider: 'rgba(200,240,224,0.10)',
            text: { primary: '#EAF3ED', secondary: 'rgba(210,232,222,0.64)' },
          }
        : {
            mode: 'light',
            primary: { main: '#40614A' },
            secondary: { main: '#8B6F4E' },
            background: { default: '#ECEAE2', paper: '#FFFFFF' },
            divider: 'rgba(46,61,47,0.14)',
            text: { primary: '#2E3D2F', secondary: 'rgba(46,61,47,0.66)' },
          },
  });
