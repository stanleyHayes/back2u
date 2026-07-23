import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Portal, Stack, Typography } from '@mui/material';

export interface TourStep {
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  target?: string;
  title: string;
  body: string;
}

export interface OnboardingTourProps {
  steps: TourStep[];
  open: boolean;
  /** Called when the tour ends; `completed` is false when it was skipped. */
  onClose: (completed: boolean) => void;
}

const TEAL = '#2DD4BF';
const MARIGOLD = '#E0A106';
const CARD_W = 344;
const GAP = 14;
const PAD = 8;

type Rect = { top: number; left: number; width: number; height: number };

function measure(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  // A clipped/faded element (e.g. inside a folded sidebar group) still reports
  // a full rect; checkVisibility catches those so the step gets skipped.
  if (
    typeof el.checkVisibility === 'function' &&
    !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  ) {
    return null;
  }
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Lightweight product tour: dims the app, spotlights one element per step and
 * anchors an explainer card next to it. Steps whose target is not currently
 * rendered (e.g. desktop sidebar on mobile) are skipped automatically.
 */
export function OnboardingTour({ steps, open, onClose }: OnboardingTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  // Only keep steps that can actually be shown right now.
  const visibleSteps = useMemo(() => {
    if (!open) return [];
    return steps.filter((s) => !s.target || measure(s.target) !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, steps]);

  const step = visibleSteps[index];
  const count = visibleSteps.length;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const remeasure = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setRect(measure(step?.target)));
  }, [step?.target]);

  useEffect(() => {
    if (!open || !step) return;
    if (step.target) {
      document.querySelector(step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    remeasure();
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    return () => {
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, step, remeasure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false);
      if (e.key === 'ArrowRight' && index < count - 1) setIndex((i) => i + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, count, onClose]);

  if (!open || !step || count === 0) return null;

  const last = index === count - 1;
  const spot = step.target ? rect : null;

  // Anchor the card under the spotlight when there is room, otherwise above;
  // fall back to viewport-centered for target-less steps.
  let cardSx: Record<string, unknown>;
  if (spot) {
    const below = spot.top + spot.height + GAP + 220 < window.innerHeight;
    const top = below
      ? spot.top + spot.height + PAD + GAP
      : Math.max(16, spot.top - PAD - GAP - 200);
    const left = Math.min(Math.max(16, spot.left), Math.max(16, window.innerWidth - CARD_W - 16));
    cardSx = { top, left };
  } else {
    cardSx = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }

  return (
    <Portal>
      {/* Click shield: keeps the app inert while the tour runs. */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 2000 }} />

      {spot ? (
        <Box
          sx={{
            position: 'fixed',
            zIndex: 2001,
            top: spot.top - PAD,
            left: spot.left - PAD,
            width: spot.width + PAD * 2,
            height: spot.height + PAD * 2,
            borderRadius: 2.5,
            boxShadow: `0 0 0 200vmax rgba(2,6,23,0.72), 0 0 0 2px ${TEAL}`,
            transition: 'top .25s ease, left .25s ease, width .25s ease, height .25s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 2001, bgcolor: 'rgba(2,6,23,0.72)' }} />
      )}

      <Box
        sx={{
          position: 'fixed',
          zIndex: 2002,
          width: { xs: 'calc(100vw - 32px)', sm: CARD_W },
          maxWidth: CARD_W,
          p: 2.5,
          borderRadius: 3,
          bgcolor: '#0F172A',
          color: '#F3F6FB',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px -24px rgba(0,0,0,0.8)',
          ...cardSx,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MARIGOLD,
          }}
        >
          {index + 1} of {count}
        </Typography>
        <Typography sx={{ mt: 0.75, fontWeight: 700, fontSize: 17, lineHeight: 1.25 }}>
          {step.title}
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.55, color: 'rgba(233,238,247,0.75)' }}>
          {step.body}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ mt: 2, alignItems: 'center' }}>
          {visibleSteps.map((s, i) => (
            <Box
              key={`${s.title}-${i}`}
              sx={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 999,
                bgcolor: i === index ? TEAL : 'rgba(255,255,255,0.25)',
                transition: 'width .2s ease',
              }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2.25, alignItems: 'center' }}>
          <Button
            size="small"
            onClick={() => onClose(false)}
            sx={{ color: 'rgba(233,238,247,0.6)', minWidth: 0 }}
          >
            Skip
          </Button>
          <Box sx={{ flex: 1 }} />
          {index > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => setIndex((i) => i - 1)}
              sx={{ borderRadius: 999, borderColor: 'rgba(255,255,255,0.25)' }}
            >
              Back
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={() => (last ? onClose(true) : setIndex((i) => i + 1))}
            sx={{
              borderRadius: 999,
              fontWeight: 700,
              bgcolor: MARIGOLD,
              color: '#0B3D38',
              '&:hover': { bgcolor: '#cf9305' },
            }}
          >
            {last ? 'Finish' : 'Next'}
          </Button>
        </Stack>
      </Box>
    </Portal>
  );
}
