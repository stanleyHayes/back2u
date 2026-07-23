import { AppBar, Box, Container, Stack, Toolbar } from '@mui/material';
import type { ReactNode } from 'react';

import { BrandLogo } from './BrandLogo.js';

export function AppShell({
  navRight,
  children,
  maxWidth = 'lg',
}: {
  navRight?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
}) {
  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          // marigold→teal brand accent hairline along the very top
          borderTop: '2px solid',
          borderImage: 'linear-gradient(90deg, #0F766E, #E0A106, #0F766E) 1',
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          backgroundColor: 'rgba(251,246,236,0.82)',
          backdropFilter: 'saturate(150%) blur(12px)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 60, md: 68 } }}>
          <BrandLogo />
          <Box flex={1} />
          <Stack direction="row" spacing={{ xs: 0.5, md: 1.5 }} alignItems="center">
            {navRight}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
