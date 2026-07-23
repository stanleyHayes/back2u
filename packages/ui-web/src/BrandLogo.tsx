import { Box, Typography } from '@mui/material';

const PAPER = '#FBF6EC';

/**
 * The Back2u mark: a rounded "U" (Back2-U) that doubles as a return path — its
 * right arm rises into an arrowhead pointing up and out toward you (the item
 * coming back), cradling a location pin at its centre.
 */
export function BrandMark({ size = 30, onDark = false }: { size?: number; onDark?: boolean }) {
  const gradId = 'b2uMark';
  const dot = onDark ? '#04201d' : PAPER;
  return (
    <Box
      component="svg"
      viewBox="0 0 48 48"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#2DD4BF" />
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
      {/* location pin nested in the U's cradle */}
      <path
        d="M24 15.5 c-3.4 0 -6.1 2.7 -6.1 6 c0 4.3 6.1 9.6 6.1 9.6 s6.1 -5.3 6.1 -9.6 c0 -3.3 -2.7 -6 -6.1 -6 z"
        fill={`url(#${gradId})`}
      />
      <circle cx="24" cy="21.5" r="2.4" fill={dot} />
    </Box>
  );
}

/** Back2u logo lockup: the return-loop pin mark + Black Ops One wordmark. */
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
          Back2u
        </Typography>
      )}
    </Box>
  );
}
