import { createTheme, type ThemeOptions } from '@mui/material/styles';

const baseTokens: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: '#0F766E' }, // teal — recovery / trust
    secondary: { main: '#F59E0B' }, // amber — reward / found
    error: { main: '#DC2626' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 12 },
  typography: {
    // Brand body face: Outfit. Headings use the Fraunces display serif.
    fontFamily: '"Outfit", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.015em' },
    h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
};

export const makeTheme = (overrides?: ThemeOptions) =>
  createTheme({ ...baseTokens, ...overrides });

export const back2uTheme = makeTheme();
