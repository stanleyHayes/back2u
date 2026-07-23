import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

import type { WebsiteMode } from '../theme';

const KEY = 'back2u.website.theme';
const listeners = new Set<() => void>();

function read(): WebsiteMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

let mode: WebsiteMode = read();

export function setThemeMode(next: WebsiteMode) {
  mode = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useThemeMode(): WebsiteMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => mode,
    () => 'light',
  );
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/** Flips the theme with a circular reveal expanding from the click point. */
export function toggleThemeWithReveal(origin: { clientX: number; clientY: number }) {
  const next: WebsiteMode = mode === 'dark' ? 'light' : 'dark';
  const doc = document as ViewTransitionDocument;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || reduceMotion) {
    setThemeMode(next);
    return;
  }

  const x = origin.clientX;
  const y = origin.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
    flushSync(() => setThemeMode(next));
  });

  void transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
      {
        duration: 480,
        easing: 'cubic-bezier(.4, 0, .2, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}
