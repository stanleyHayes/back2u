import { CssBaseline, ThemeProvider } from '@mui/material';
import { makeTheme } from '@back2u/ui-web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App.js';

const partnerTheme = makeTheme({
  palette: { mode: 'dark', primary: { main: '#0F766E' }, background: { default: '#0B1220', paper: '#111827' } },
});

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={partnerTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
