import { describe, expect, it } from 'vitest';

import { Match } from '../../src/domain/match/match.entity.js';
import { haversineMeters } from '../../src/domain/shared/value-objects.js';

describe('Match weighting', () => {
  it('image dominates the score', () => {
    const m = Match.suggest({
      id: 'm1',
      lostItemId: 'l',
      foundItemId: 'f',
      imageScore: 1,
      textScore: 0,
      geoScore: 0,
      timeScore: 0,
    });
    expect(m.snapshot.score).toBeCloseTo(0.4, 5);
  });
  it('text + geo + time without image still produces a meaningful score', () => {
    const m = Match.suggest({
      id: 'm2',
      lostItemId: 'l',
      foundItemId: 'f',
      imageScore: 0,
      textScore: 1,
      geoScore: 1,
      timeScore: 1,
    });
    expect(m.snapshot.score).toBeCloseTo(0.6, 5);
  });
});

describe('haversineMeters', () => {
  it('zero distance for identical points', () => {
    const p = { type: 'Point' as const, coordinates: [-0.1, 5.6] as [number, number] };
    expect(haversineMeters(p, p)).toBeCloseTo(0, 5);
  });
  it('non-trivial distance for two known points', () => {
    const a = { type: 'Point' as const, coordinates: [-0.187, 5.603] as [number, number] };
    const b = { type: 'Point' as const, coordinates: [-1.567, 6.673] as [number, number] };
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(180_000);
    expect(d).toBeLessThan(220_000);
  });
});
