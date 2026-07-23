import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import './i18n';
import './styles/site.css';
import { makeWebsiteTheme } from './theme';
import { useThemeMode } from './lib/theme-mode';
import { App } from './App';

function Root() {
  const mode = useThemeMode();
  const theme = useMemo(() => makeWebsiteTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
