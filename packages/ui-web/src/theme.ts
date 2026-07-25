import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';

// --- Neumorphic (soft-UI) shadow tokens, mode-aware ---
// Raised = extruded from the surface; inset = pressed in. Derived from the
// neutral-white (light) / forest (dark) grounds so elements read as one soft material.
const NEU_RAISED_LIGHT =
  '10px 10px 24px rgba(190,198,193,0.48), -10px -10px 24px rgba(255,255,255,1)';
const NEU_RAISED_DARK = '10px 10px 24px rgba(10,15,9,0.78), -10px -10px 24px rgba(58,74,48,0.42)';
const NEU_INSET_LIGHT =
  'inset 5px 5px 12px rgba(190,198,193,0.48), inset -5px -5px 12px rgba(255,255,255,1)';
const NEU_INSET_DARK =
  'inset 5px 5px 12px rgba(10,15,9,0.78), inset -5px -5px 12px rgba(58,74,48,0.42)';

export const neuShadow = (mode: 'light' | 'dark', variant: 'raised' | 'inset' = 'raised') =>
  variant === 'inset'
    ? mode === 'dark'
      ? NEU_INSET_DARK
      : NEU_INSET_LIGHT
    : mode === 'dark'
      ? NEU_RAISED_DARK
      : NEU_RAISED_LIGHT;

/** sx helper: a raised neumorphic surface (no border). */
export const neuRaised = {
  border: 'none',
  boxShadow: (t: Theme) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
};
/** sx helper: an inset (pressed-in) neumorphic surface. */
export const neuInset = {
  border: 'none',
  boxShadow: (t: Theme) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'inset'),
};

const baseTokens: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: '#40614A' }, // teal — recovery / trust
    secondary: { main: '#8B6F4E', contrastText: '#F2EFEA' }, // amber — reward / found
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
        root: ({ theme }) => ({
          borderRadius: 999,
          border: 'none',
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          transition: 'transform .12s ease, box-shadow .2s ease, background-color .2s ease',
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(168,181,160,0.07)' : 'rgba(255,255,255,0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'inset'),
          },
          '&.Mui-disabled': { boxShadow: 'none' },
        }),
        contained: ({ theme }) => ({
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          '&:hover': {
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          },
        }),
        text: ({ theme }) => ({ backgroundColor: theme.palette.background.paper }),
        outlined: ({ theme }) => ({
          border: 'none',
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
        }),
        grouped: {
          border: 'none !important',
          boxShadow: 'none !important',
          borderRadius: '0 !important',
          '&:hover': { transform: 'none', boxShadow: 'none !important' },
          '&:active': { transform: 'none', boxShadow: 'none !important' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          backgroundImage: 'none',
          ...(ownerState.elevation !== 0 && {
            border: 'none',
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          }),
        }),
        outlined: ({ theme }) => ({
          border: 'none',
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
        }),
      },
    },
    // Cards get a soft neumorphic lift instead of a hard border.
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 'none',
          borderRadius: 14,
          backgroundColor: theme.palette.background.paper,
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          transition: 'transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .2s ease',
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 'none',
          borderRadius: '50%',
          backgroundColor: theme.palette.background.paper,
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          transition: 'transform .12s ease, background-color .2s ease, color .2s ease',
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(168,181,160,0.08)' : 'rgba(255,255,255,0.36)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'inset'),
          },
          '&.Mui-disabled': { boxShadow: 'none' },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 'none',
          backgroundColor: theme.palette.background.paper,
          boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          fontWeight: 600,
        }),
        clickable: ({ theme }) => ({
          '&:active': {
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'inset'),
          },
        }),
      },
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 999,
          paddingInline: '0.35em',
          transition: 'color .18s ease, background-color .18s ease, box-shadow .18s ease',
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(168,181,160,0.07)' : 'rgba(255,255,255,0.3)',
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          },
          '&:active': {
            boxShadow: neuShadow(theme.palette.mode === 'dark' ? 'dark' : 'light', 'inset'),
          },
        }),
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
 * Mode-aware theme for the customer-facing client app. Light uses a clean
 * white canvas so the soft-UI shadows stay crisp; dark stays forest green.
 */
export const makeClientTheme = (mode: 'light' | 'dark') =>
  mode === 'dark'
    ? makeTheme({
        palette: {
          mode: 'dark',
          primary: { main: '#A8B5A0' },
          secondary: { main: '#8B6F4E', contrastText: '#F2EFEA' },
          error: { main: '#F87171' },
          background: { default: '#1C231B', paper: '#263026' },
          divider: 'rgba(210,232,222,0.10)',
          text: { primary: '#EAF3ED', secondary: 'rgba(210,232,222,0.66)' },
        },
      })
    : makeTheme({
        palette: {
          mode: 'light',
          primary: { main: '#40614A' },
          secondary: { main: '#8B6F4E', contrastText: '#FFFFFF' },
          error: { main: '#DC2626' },
          background: { default: '#FFFFFF', paper: '#FFFFFF' },
          divider: 'rgba(46,61,47,0.10)',
          text: { primary: '#2E3D2F', secondary: 'rgba(46,61,47,0.66)' },
        },
      });

/** Header/nav pill background for AppShell, per mode. */
export const clientHeaderBg = (dark: boolean) =>
  dark ? 'rgba(20,32,27,0.86)' : 'rgba(255,255,255,0.90)';

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
            secondary: { main: '#8B6F4E', contrastText: '#F2EFEA' },
            background: { default: '#1C231B', paper: '#263026' },
            divider: 'rgba(200,240,224,0.10)',
            text: { primary: '#EAF3ED', secondary: 'rgba(210,232,222,0.64)' },
          }
        : {
            mode: 'light',
            primary: { main: '#40614A' },
            secondary: { main: '#8B6F4E', contrastText: '#F2EFEA' },
            background: { default: '#ECEAE2', paper: '#FFFFFF' },
            divider: 'rgba(46,61,47,0.14)',
            text: { primary: '#2E3D2F', secondary: 'rgba(46,61,47,0.66)' },
          },
  });
