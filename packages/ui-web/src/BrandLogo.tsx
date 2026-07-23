import { Box, Typography } from '@mui/material';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';

/** Back2u logo lockup: a tilted map-pin tag + Fraunces wordmark. */
export function BrandLogo({ size = 30, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '37% 37% 37% 10%',
          background: 'linear-gradient(140deg, #0F766E 0%, #14B8A6 100%)',
          display: 'grid',
          placeItems: 'center',
          transform: 'rotate(-6deg)',
          boxShadow: '0 6px 14px -8px rgba(15,118,110,.9)',
          flexShrink: 0,
        }}
      >
        <Box sx={{ width: size * 0.28, height: size * 0.28, borderRadius: '50%', bgcolor: PAPER }} />
      </Box>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          fontSize: size * 0.72,
          letterSpacing: '-0.03em',
          color: onDark ? PAPER : INK,
          lineHeight: 1,
        }}
      >
        Back2u
      </Typography>
    </Box>
  );
}
