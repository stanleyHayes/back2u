import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

const TONES = {
  teal: { main: '#2DD4BF', soft: 'rgba(45,212,191,0.12)' },
  marigold: { main: '#E0A106', soft: 'rgba(224,161,6,0.14)' },
  clay: { main: '#C2410C', soft: 'rgba(194,65,12,0.12)' },
} as const;

/**
 * Unified dashboard page header: tinted icon tile + title + description,
 * with an optional actions slot on the right. Consistent across the admin
 * and partner consoles (inspired by the daadd PageHeader pattern).
 */
export function PageHeader({
  icon,
  title,
  description,
  actions,
  tone = 'teal',
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        animation: 'b2uFadeUp .5s cubic-bezier(.2,.7,.2,1) both',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            bgcolor: t.soft,
            color: t.main,
            '& svg': { fontSize: 28 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Black Ops One", Georgia, serif',
              fontWeight: 600,
              fontSize: { xs: 22, md: 26 },
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 14, maxWidth: 640 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>
  );
}
