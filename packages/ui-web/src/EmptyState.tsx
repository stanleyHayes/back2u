import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

const TONES = {
  teal: { main: '#0F766E', soft: 'rgba(15,118,110,0.12)', glow: 'rgba(15,118,110,0.28)' },
  marigold: { main: '#E0A106', soft: 'rgba(224,161,6,0.14)', glow: 'rgba(224,161,6,0.30)' },
  clay: { main: '#C2410C', soft: 'rgba(194,65,12,0.12)', glow: 'rgba(194,65,12,0.28)' },
} as const;

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  startIcon?: ReactNode;
  variant?: 'primary' | 'secondary';
};

/**
 * Sophisticated, brand-consistent empty state: an animated haloed icon,
 * a Fraunces title, a supporting line, and up to a couple of action buttons.
 * Theme-aware (reads text colours from the active MUI theme) so it looks right
 * on the light client apps and the dark admin console alike.
 */
export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  tone = 'teal',
  dense = false,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  tone?: keyof typeof TONES;
  dense?: boolean;
}) {
  const t = TONES[tone];

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: dense ? 5 : { xs: 7, md: 10 },
        px: 3,
        maxWidth: 460,
        mx: 'auto',
        // staggered entrance
        '@keyframes b2uEmptyIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: 'b2uEmptyIn .5s cubic-bezier(.2,.7,.2,1) both',
      }}
    >
      {/* Animated halo + floating icon badge */}
      <Box
        sx={{
          position: 'relative',
          width: dense ? 88 : 112,
          height: dense ? 88 : 112,
          mx: 'auto',
          mb: dense ? 2 : 3,
          display: 'grid',
          placeItems: 'center',
          '@keyframes b2uPulse': {
            '0%': { transform: 'scale(0.85)', opacity: 0.55 },
            '70%': { transform: 'scale(1.35)', opacity: 0 },
            '100%': { transform: 'scale(1.35)', opacity: 0 },
          },
          '@keyframes b2uFloat': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-6px)' },
          },
        }}
      >
        {/* expanding rings */}
        {[0, 1].map((i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1.5px solid ${t.main}`,
              animation: 'b2uPulse 2.8s ease-out infinite',
              animationDelay: `${i * 1.4}s`,
            }}
          />
        ))}
        {/* soft glow disc */}
        <Box sx={{ position: 'absolute', inset: 8, borderRadius: '50%', bgcolor: t.soft }} />
        {/* floating badge */}
        <Box
          sx={{
            position: 'relative',
            width: dense ? 56 : 68,
            height: dense ? 56 : 68,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: '#FFFDF8',
            background: `linear-gradient(150deg, ${t.main}, ${t.main}cc)`,
            boxShadow: `0 18px 34px -18px ${t.glow}`,
            animation: 'b2uFloat 4s ease-in-out infinite',
            '& svg': { fontSize: dense ? 26 : 32 },
          }}
        >
          {icon}
        </Box>
      </Box>

      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontSize: dense ? 20 : 26,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 15, lineHeight: 1.65 }}>
          {description}
        </Typography>
      )}

      {actions.length > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          justifyContent="center"
          sx={{ mt: dense ? 2.5 : 3.5 }}
        >
          {actions.map((a) => {
            const isPrimary = (a.variant ?? 'primary') === 'primary';
            return (
              <Button
                key={a.label}
                onClick={a.onClick}
                href={a.href}
                startIcon={a.startIcon}
                variant={isPrimary ? 'contained' : 'outlined'}
                sx={
                  isPrimary
                    ? {
                        bgcolor: '#0B3D38',
                        color: '#FBF6EC',
                        borderRadius: 999,
                        px: 2.5,
                        py: 1,
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#0a322e' },
                      }
                    : {
                        borderRadius: 999,
                        px: 2.5,
                        py: 1,
                        fontWeight: 600,
                        color: 'text.primary',
                        borderColor: 'divider',
                        '&:hover': { borderColor: t.main, color: t.main, bgcolor: t.soft },
                      }
                }
              >
                {a.label}
              </Button>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
