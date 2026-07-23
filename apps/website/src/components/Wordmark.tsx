import { Box, Typography } from '@mui/material';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';

/** Back2u logo lockup: a tilted map-pin tag + Fraunces wordmark. */
export function Wordmark({ onDark = false, size = 'md' }: { onDark?: boolean; size?: 'sm' | 'md' }) {
  const dot = size === 'sm' ? 28 : 32;
  const fs = size === 'sm' ? 20 : 23;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1 }}>
      <Box
        sx={{
          width: dot,
          height: dot,
          borderRadius: '12px 12px 12px 3px',
          background: 'linear-gradient(140deg, #0F766E 0%, #14B8A6 100%)',
          display: 'grid',
          placeItems: 'center',
          transform: 'rotate(-6deg)',
          boxShadow: '0 8px 18px -10px rgba(15,118,110,.9)',
          flexShrink: 0,
        }}
      >
        <Box sx={{ width: dot * 0.28, height: dot * 0.28, borderRadius: '50%', bgcolor: PAPER }} />
      </Box>
      <Typography
        className="b2u-display"
        sx={{ fontWeight: 600, fontSize: fs, letterSpacing: '-0.03em', color: onDark ? PAPER : INK }}
      >
        Back2u
      </Typography>
    </Box>
  );
}
