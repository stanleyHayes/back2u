import { Box, Container, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { BrandMark } from './BrandLogo.js';

const INK = '#17221D';
const CREAM = '#F2EFEA';

/**
 * App shell for the customer-facing client — a deep forest command bar based
 * on reference design #2. The logo lockup, navigation and actions share one
 * technical surface with a fine sage keyline and restrained texture.
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
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          px: { xs: 1.5, sm: 3, xl: 4 },
          pt: { xs: 1, sm: 1.75 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1440,
            mx: 'auto',
            display: 'flex',
            alignItems: 'stretch',
            minHeight: { xs: 62, md: 78 },
            borderRadius: { xs: '16px', md: '20px' },
            overflow: 'hidden',
            border: '1px solid rgba(168,181,160,0.24)',
            bgcolor: INK,
            backgroundImage:
              'radial-gradient(circle at 86% 10%, rgba(126,154,130,0.14), transparent 24%), linear-gradient(120deg, transparent 62%, rgba(64,97,74,0.11) 100%)',
            boxShadow: '0 18px 42px -24px rgba(23,34,29,0.85)',
            position: 'relative',
            isolation: 'isolate',
            '&::after': {
              content: '\"\"',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.18,
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent 0 7px, rgba(168,181,160,0.08) 7px 8px)',
              clipPath: 'polygon(70% 0, 100% 0, 100% 100%, 56% 100%)',
              zIndex: -1,
            },
          }}
        >
          {/* Compact brand lockup with design #2's vertical separator. */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.4,
              flexShrink: 0,
              pl: { xs: 1.75, md: 3 },
              pr: { xs: 1.75, md: 3.5 },
              my: { xs: 1.25, md: 1.7 },
              borderRight: { xs: 0, sm: '1px solid rgba(168,181,160,0.24)' },
            }}
          >
            <BrandMark size={32} onDark />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  color: CREAM,
                  fontWeight: 600,
                  fontSize: 19,
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                bak2me
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(242,239,234,0.58)',
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

          {/* Navigation stays quiet until hover or active state. */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pl: { xs: 0.75, md: 2.75 },
              pr: { xs: 0.75, md: 2 },
            }}
          >
            <Stack
              direction="row"
              spacing={{ xs: 0.25, md: 0.65 }}
              sx={{ alignItems: 'center', color: CREAM }}
            >
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
