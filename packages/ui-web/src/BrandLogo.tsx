import { Box, Typography } from '@mui/material';

const PAPER = '#F2EFEA';

/**
 * The bak2me mark: a rounded "U" (bak-2-U) that doubles as a return path — its
 * right arm rises into an arrowhead pointing up and out toward you (the item
 * coming back), cradling a hand pointing up and out at you — "back to you".
 */
export function BrandMark({ size = 30 }: { size?: number; onDark?: boolean }) {
  const gradId = 'b2uMark';
  return (
    <Box
      component="svg"
      viewBox="0 0 48 48"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#40614A" />
          <stop offset="1" stopColor="#A8B5A0" />
        </linearGradient>
      </defs>
      {/* the "U" — return path: down the left arm, round the base, up the right */}
      <path
        d="M13 12 L13 27 A 11 11 0 0 0 35 27 L35 14.5"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={4.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* arrowhead on the right arm, pointing up & out toward the viewer */}
      <path d="M35 5.5 L29.8 13 L40.2 13 Z" fill={`url(#${gradId})`} />
      {/* hand pointing up & out at you, nested in the U's cradle — "back to you" */}
      <g fill={`url(#${gradId})`}>
        <rect x="21.7" y="12.5" width="4.6" height="13" rx="2.3" />
        <path d="M17.2 20.8 h13.6 a2.3 2.3 0 0 1 2.3 2.3 v2.7 a5.6 5.6 0 0 1 -5.6 5.6 h-6.9 a5.6 5.6 0 0 1 -5.6 -5.6 v-2.7 a2.3 2.3 0 0 1 2.3 -2.3 z" />
        <path d="M17.2 23 a2.6 2.6 0 0 0 -3 1.7 a1.5 1.5 0 0 0 1.1 1.9 l1.9 0.4 z" />
      </g>
    </Box>
  );
}

/** bak2me logo lockup: the return-loop pin mark + Black Ops One wordmark. */
export function BrandLogo({
  size = 30,
  onDark = false,
  compact = false,
}: {
  size?: number;
  onDark?: boolean;
  /** Renders only the pin mark (for collapsed sidebars / rails). */
  compact?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <BrandMark size={size} onDark={onDark} />
      {!compact && (
        <Typography
          sx={{
            fontFamily: '"Black Ops One", Georgia, serif',
            fontWeight: 600,
            fontSize: size * 0.72,
            letterSpacing: '-0.03em',
            // onDark forces cream (fixed dark panels); otherwise follow the theme
            // so the wordmark stays legible in both light and dark mode.
            color: onDark ? PAPER : 'text.primary',
            lineHeight: 1,
          }}
        >
          bak2me
        </Typography>
      )}
    </Box>
  );
}
