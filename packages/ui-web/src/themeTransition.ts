import { flushSync } from 'react-dom';

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/**
 * Applies a theme change with a circular-reveal animation that expands from the
 * point the user clicked (the toggle), using the View Transitions API.
 *
 * `apply` must synchronously flip the theme state; it is run inside
 * `startViewTransition` (wrapped in flushSync) so the new theme is painted
 * before the transition captures its "after" snapshot. Falls back to an instant
 * switch when View Transitions are unavailable or reduced motion is requested.
 */
export function circularThemeTransition(
  origin: { clientX: number; clientY: number },
  apply: () => void,
): void {
  const doc = document as ViewTransitionDocument;
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || reduceMotion) {
    apply();
    return;
  }

  const x = origin.clientX;
  const y = origin.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
    flushSync(() => apply());
  });

  void transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
      },
      {
        duration: 480,
        easing: 'cubic-bezier(.4, 0, .2, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}

/**
 * Global CSS that disables the default cross-fade so the circular clip-path is
 * the only visible transition. Feed to MUI `<GlobalStyles styles={...}>`.
 */
export const viewTransitionStyles = {
  '::view-transition-old(root), ::view-transition-new(root)': {
    animation: 'none',
    mixBlendMode: 'normal',
  },
  '::view-transition-old(root)': { zIndex: 0 },
  '::view-transition-new(root)': { zIndex: 1 },
} as const;
