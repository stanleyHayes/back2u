import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './i18n';
import './styles/site.css';
import { websiteTheme } from './theme';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={websiteTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
