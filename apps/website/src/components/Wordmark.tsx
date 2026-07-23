import { Box, Typography } from '@mui/material';

const PAPER = '#FBF6EC';

/** The Back2u return-loop mark: an arrow looping back on itself around a pin. */
function Mark({ px, onDark }: { px: number; onDark: boolean }) {
  const dot = onDark ? '#04201d' : PAPER;
  return (
    <Box
      component="svg"
      viewBox="0 0 48 48"
      sx={{ width: px, height: px, flexShrink: 0, display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="b2uWordmark"
          x1="8"
          y1="6"
          x2="40"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <path
        d="M13 12 L13 27 A 11 11 0 0 0 35 27 L35 14.5"
        fill="none"
        stroke="url(#b2uWordmark)"
        strokeWidth={4.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M35 5.5 L29.8 13 L40.2 13 Z" fill="url(#b2uWordmark)" />
      <path
        d="M24 15.5 c-3.4 0 -6.1 2.7 -6.1 6 c0 4.3 6.1 9.6 6.1 9.6 s6.1 -5.3 6.1 -9.6 c0 -3.3 -2.7 -6 -6.1 -6 z"
        fill="url(#b2uWordmark)"
      />
      <circle cx="24" cy="21.5" r="2.4" fill={dot} />
    </Box>
  );
}

/** Back2u logo lockup: the return-loop pin mark + Black Ops One wordmark. */
export function Wordmark({
  onDark = false,
  size = 'md',
}: {
  onDark?: boolean;
  size?: 'sm' | 'md';
}) {
  const dot = size === 'sm' ? 28 : 32;
  const fs = size === 'sm' ? 20 : 23;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1 }}>
      <Mark px={dot} onDark={onDark} />
      <Typography
        className="b2u-display"
        sx={{
          fontWeight: 600,
          fontSize: fs,
          letterSpacing: '-0.03em',
          color: onDark ? PAPER : 'text.primary',
        }}
      >
        Back2u
      </Typography>
    </Box>
  );
}
