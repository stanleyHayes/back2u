import { Box, Typography } from '@mui/material';

const PAPER = '#F2EFEA';

/** The bak2me return-loop mark: an arrow looping back on itself around a hand pointing at you. */
function Mark({ px }: { px: number; onDark?: boolean }) {
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
          <stop stopColor="#40614A" />
          <stop offset="1" stopColor="#7E9A82" />
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
      {/* hand pointing up & out at you, nested in the U's cradle — "back to you" */}
      <g fill="url(#b2uWordmark)">
        <rect x="21.7" y="12.5" width="4.6" height="13" rx="2.3" />
        <path d="M17.2 20.8 h13.6 a2.3 2.3 0 0 1 2.3 2.3 v2.7 a5.6 5.6 0 0 1 -5.6 5.6 h-6.9 a5.6 5.6 0 0 1 -5.6 -5.6 v-2.7 a2.3 2.3 0 0 1 2.3 -2.3 z" />
        <path d="M17.2 23 a2.6 2.6 0 0 0 -3 1.7 a1.5 1.5 0 0 0 1.1 1.9 l1.9 0.4 z" />
      </g>
    </Box>
  );
}

/** bak2me logo lockup: the return-loop pin mark + Black Ops One wordmark. */
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
        bak2me
      </Typography>
    </Box>
  );
}
