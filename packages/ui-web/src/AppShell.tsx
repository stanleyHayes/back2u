import { Box, Container, Stack, useTheme } from '@mui/material';
import type { ReactNode } from 'react';

import { BrandLogo } from './BrandLogo.js';
import { clientHeaderBg } from './theme.js';

export function AppShell({
  navRight,
  children,
  maxWidth = 'lg',
}: {
  navRight?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
}) {
  const dark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 1, sm: 1.5 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1100,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minHeight: { xs: 56, md: 60 },
            px: { xs: 1.5, sm: 2.5 },
            py: 0.75,
            borderRadius: 999,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: clientHeaderBg(dark),
            backdropFilter: 'saturate(150%) blur(14px)',
            boxShadow: dark
              ? '0 8px 28px rgba(0,0,0,0.4)'
              : '0 8px 28px rgba(11,61,56,0.12), 0 1px 0 rgba(255,255,255,0.6) inset',
          }}
        >
          <BrandLogo />
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={{ xs: 0.5, md: 1.5 }} sx={{ alignItems: 'center' }}>
            {navRight}
          </Stack>
        </Box>
      </Box>
      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
