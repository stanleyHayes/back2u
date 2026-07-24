import { Box, Container, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';

import { BrandMark } from './BrandLogo.js';

const INK = '#2E3D2F';
const CREAM = '#F2EFEA';

/**
 * App shell for the customer-facing client — a split "brand panel + nav zone"
 * header: a dark forest panel (mark + wordmark + tagline) with a curved right
 * edge on the left, and the app's nav/actions in the light zone on the right.
 */
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
            maxWidth: 1200,
            mx: 'auto',
            display: 'flex',
            alignItems: 'stretch',
            minHeight: { xs: 60, md: 70 },
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: dark ? '#263026' : '#FAF8F3',
            backdropFilter: 'saturate(150%) blur(14px)',
            boxShadow: dark ? '0 10px 30px rgba(0,0,0,0.45)' : '0 12px 30px rgba(46,61,47,0.14)',
          }}
        >
          {/* Dark brand panel with a curved right edge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexShrink: 0,
              pl: { xs: 2, md: 2.5 },
              pr: { xs: 2.5, md: 4 },
              bgcolor: INK,
              borderRadius: '0 36px 36px 0',
            }}
          >
            <BrandMark size={30} onDark />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  color: CREAM,
                  fontWeight: 600,
                  fontSize: 18,
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                Back2u
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(242,239,234,0.6)',
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Lost. Found. Returned.
              </Typography>
            </Box>
          </Box>

          {/* Light nav zone */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pl: { xs: 1, md: 2 },
              pr: { xs: 1, md: 1.5 },
            }}
          >
            <Stack direction="row" spacing={{ xs: 0.25, md: 0.75 }} sx={{ alignItems: 'center' }}>
              {navRight}
            </Stack>
          </Box>
        </Box>
      </Box>
      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
