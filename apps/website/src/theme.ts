import { createTheme } from '@mui/material/styles';

/**
 * Back2u marketing theme — "warm editorial reunion".
 * Paper-and-ink magazine aesthetic: warm paper ground, deep-teal ink,
 * marigold + clay accents. Fraunces (display serif) + Hanken Grotesk (body).
 */

const PAPER = '#FBF6EC';
const PAPER_RAISED = '#FFFDF8';
const INK = '#0B3D38';
const INK_SOFT = '#3C544F';
const TEAL = '#0F766E';
const TEAL_BRIGHT = '#14B8A6';
const MARIGOLD = '#E0A106';
const CLAY = '#C2410C';

const display = '"Fraunces", "Iowan Old Style", Georgia, "Times New Roman", serif';
const body = '"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif';

export const websiteTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: TEAL, light: TEAL_BRIGHT, dark: '#0B5C55', contrastText: '#FFFDF8' },
    secondary: { main: MARIGOLD, light: '#F3C969', dark: '#B97F05', contrastText: INK },
    error: { main: CLAY },
    success: { main: TEAL },
    text: { primary: INK, secondary: INK_SOFT },
    background: { default: PAPER, paper: PAPER_RAISED },
    divider: 'rgba(11, 61, 56, 0.12)',
  },
  shape: { borderRadius: 14 },
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
        ':root': { colorScheme: 'light' },
        body: {
          backgroundColor: PAPER,
          backgroundImage: [
            `radial-gradient(60rem 60rem at 88% -8%, rgba(224,161,6,0.16), transparent 60%)`,
            `radial-gradient(48rem 48rem at -6% 12%, rgba(20,184,166,0.14), transparent 55%)`,
            `radial-gradient(70rem 50rem at 50% 120%, rgba(11,61,56,0.06), transparent 60%)`,
          ].join(','),
          backgroundAttachment: 'fixed',
          color: INK,
          WebkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility',
        },
        '#root': { minHeight: '100vh', position: 'relative', isolation: 'isolate' },
        '::selection': { background: 'rgba(224,161,6,0.32)' },
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
          transition: 'transform .18s cubic-bezier(.2,.7,.2,1), box-shadow .18s ease, background-color .18s ease',
          // disableElevation removes the ripple, which also drops MUI's default
          // :focus-visible styling — restore a clear, branded keyboard focus ring.
          '&:focus-visible': {
            outline: '2px solid #0B3D38',
            outlineOffset: 2,
            boxShadow: '0 0 0 4px rgba(11,61,56,0.14)',
          },
        },
        sizeLarge: { paddingInline: 30, paddingBlock: 14, fontSize: '1.02rem' },
        contained: {
          boxShadow: '0 1px 0 rgba(255,255,255,.4) inset, 0 10px 24px -12px rgba(11,61,56,.5)',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 30px -14px rgba(11,61,56,.55)' },
        },
        outlined: {
          borderColor: 'rgba(11,61,56,0.28)',
          '&:hover': { borderColor: INK, background: 'rgba(11,61,56,0.04)', transform: 'translateY(-2px)' },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(11,61,56,0.10)',
          boxShadow: '0 1px 2px rgba(11,61,56,.04)',
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
          borderTop: '1px solid rgba(11,61,56,0.12)',
          '&:last-of-type': { borderBottom: '1px solid rgba(11,61,56,0.12)' },
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

export default websiteTheme;
