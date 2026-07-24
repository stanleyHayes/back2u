import { createTheme } from '@mui/material/styles';

/**
 * Back2u marketing theme — "warm editorial reunion".
 * Paper-and-ink magazine aesthetic: warm paper ground, deep-teal ink,
 * marigold + clay accents. Black Ops One (display face) + Hanken Grotesk (body).
 * Now mode-aware: a deep forest-green ground carries the same brand in dark.
 */

export type WebsiteMode = 'light' | 'dark';

// Shared brand accents
const TEAL = '#40614A';
const TEAL_BRIGHT = '#7E9A82';
const MARIGOLD = '#8B6F4E';
const CLAY = '#C2410C';

// Light ("paper") tokens
const PAPER = '#F2EFEA';
const PAPER_RAISED = '#FAF8F3';
const INK = '#2E3D2F';
const INK_SOFT = '#3C544F';

// Dark ("forest") tokens
const FOREST = '#1C231B';
const FOREST_RAISED = '#263026';
const CREAM = '#EAF3ED';
const CREAM_SOFT = 'rgba(210,232,222,0.66)';

const display = '"Black Ops One", "Iowan Old Style", Georgia, "Times New Roman", serif';
const body = '"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif';

export function makeWebsiteTheme(mode: WebsiteMode) {
  const dark = mode === 'dark';
  const ground = dark ? FOREST : PAPER;
  const raised = dark ? FOREST_RAISED : PAPER_RAISED;
  const textPrimary = dark ? CREAM : INK;
  const textSecondary = dark ? CREAM_SOFT : INK_SOFT;
  const divider = dark ? 'rgba(210,232,222,0.12)' : 'rgba(11, 61, 56, 0.12)';
  const primaryMain = dark ? TEAL_BRIGHT : TEAL;
  const focusInk = dark ? CREAM : INK;

  const bodyGradients = dark
    ? [
        `radial-gradient(60rem 60rem at 88% -8%, rgba(139,111,78,0.12), transparent 60%)`,
        `radial-gradient(48rem 48rem at -6% 12%, rgba(126,154,130,0.14), transparent 55%)`,
        `radial-gradient(70rem 50rem at 50% 120%, rgba(126,154,130,0.06), transparent 60%)`,
      ]
    : [
        `radial-gradient(60rem 60rem at 88% -8%, rgba(139,111,78,0.16), transparent 60%)`,
        `radial-gradient(48rem 48rem at -6% 12%, rgba(126,154,130,0.14), transparent 55%)`,
        `radial-gradient(70rem 50rem at 50% 120%, rgba(46,61,47,0.06), transparent 60%)`,
      ];

  return createTheme({
    palette: {
      mode,
      primary: { main: primaryMain, light: TEAL_BRIGHT, dark: '#0B5C55', contrastText: '#FAF8F3' },
      secondary: { main: MARIGOLD, light: '#F3C969', dark: '#6F5940', contrastText: INK },
      error: { main: CLAY },
      success: { main: primaryMain },
      text: { primary: textPrimary, secondary: textSecondary },
      background: { default: ground, paper: raised },
      divider,
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: body,
      h1: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.02 },
      h2: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.08 },
      h3: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.12 },
      h4: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontFamily: body, fontWeight: 700 },
      h6: { fontFamily: body, fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      body1: { lineHeight: 1.65 },
      body2: { lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': { colorScheme: mode },
          body: {
            backgroundColor: ground,
            backgroundImage: bodyGradients.join(','),
            backgroundAttachment: 'fixed',
            color: textPrimary,
            WebkitFontSmoothing: 'antialiased',
            textRendering: 'optimizeLegibility',
          },
          '#root': { minHeight: '100vh', position: 'relative', isolation: 'isolate' },
          '::selection': { background: 'rgba(139,111,78,0.32)' },
          '::view-transition-old(root), ::view-transition-new(root)': {
            animation: 'none',
            mixBlendMode: 'normal',
          },
          '::view-transition-old(root)': { zIndex: 0 },
          '::view-transition-new(root)': { zIndex: 1 },
          '@keyframes b2uFadeUp': {
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'none' },
          },
          '@keyframes b2uFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
          '@media (prefers-reduced-motion: reduce)': {
            '*': {
              animationDuration: '0.001ms !important',
              animationIterationCount: '1 !important',
            },
          },
        },
      },
      MuiContainer: { defaultProps: { maxWidth: 'lg' } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 22,
            paddingBlock: 9,
            transition:
              'transform .18s cubic-bezier(.2,.7,.2,1), box-shadow .18s ease, background-color .18s ease',
            // disableElevation removes the ripple, which also drops MUI's default
            // :focus-visible styling — restore a clear, branded keyboard focus ring.
            '&:focus-visible': {
              outline: `2px solid ${focusInk}`,
              outlineOffset: 2,
              boxShadow: `0 0 0 4px ${dark ? 'rgba(234,243,237,0.18)' : 'rgba(46,61,47,0.14)'}`,
            },
          },
          sizeLarge: { paddingInline: 30, paddingBlock: 14, fontSize: '1.02rem' },
          contained: {
            boxShadow: '0 1px 0 rgba(255,255,255,.4) inset, 0 10px 24px -12px rgba(46,61,47,.5)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 16px 30px -14px rgba(46,61,47,.55)',
            },
          },
          outlined: {
            borderColor: divider,
            '&:hover': {
              borderColor: primaryMain,
              background: dark ? 'rgba(126,154,130,0.08)' : 'rgba(46,61,47,0.04)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: `1px solid ${divider}`,
            boxShadow: dark ? '0 1px 2px rgba(0,0,0,.3)' : '0 1px 2px rgba(46,61,47,.04)',
            transition: 'transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .2s ease',
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, letterSpacing: '0.01em' } } },
      MuiAccordion: {
        styleOverrides: {
          root: {
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            borderTop: `1px solid ${divider}`,
            '&:last-of-type': { borderBottom: `1px solid ${divider}` },
            '&:before': { display: 'none' },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: { root: { paddingInline: 0 }, content: { marginBlock: 18 } },
      },
      MuiAccordionDetails: { styleOverrides: { root: { paddingInline: 0, paddingBottom: 22 } } },
    },
  });
}

/** Back-compat default (light). */
export const websiteTheme = makeWebsiteTheme('light');

export default websiteTheme;
