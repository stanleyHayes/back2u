import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

const INK = '#0B3D38';
const TEAL = '#0F766E';

/** Eyebrow + Fraunces title + optional subtitle — the standard page header across the user app. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          color: TEAL,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
          mb: 0.5,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          fontSize: 30,
          color: INK,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: 620, lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

/** A branded panel with the tag-corner radius and an optional icon-tile header. */
export function SectionCard({
  icon,
  title,
  desc,
  accent = TEAL,
  children,
}: {
  icon?: ReactNode;
  title?: string;
  desc?: ReactNode;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: '20px 20px 20px 6px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {(icon || title) && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2 }}>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: `${accent}1f`,
                color: accent,
                flexShrink: 0,
                '& svg': { fontSize: 21 },
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography sx={{ fontWeight: 700, fontSize: 16.5, color: INK, lineHeight: 1.3 }}>
                {title}
              </Typography>
            )}
            {desc && (
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>{desc}</Typography>
            )}
          </Box>
        </Stack>
      )}
      {children}
    </Box>
  );
}
