import { describe, expect, it } from 'vitest';

import { Match } from '../../src/domain/match/match.entity.js';

describe('Match', () => {
  it('weights image>text>geo>time and clamps to [0,1]', () => {
    const m = Match.suggest({
      id: 'm1',
      lostItemId: 'l1',
      foundItemId: 'f1',
      imageScore: 1,
      textScore: 1,
      geoScore: 1,
      timeScore: 1,
    });
    expect(m.snapshot.score).toBeCloseTo(1, 5);
  });

  it('produces 0 for opposite signals', () => {
    const m = Match.suggest({
      id: 'm2',
      lostItemId: 'l1',
      foundItemId: 'f1',
      imageScore: 0,
      textScore: 0,
      geoScore: 0,
      timeScore: 0,
    });
    expect(m.snapshot.score).toBe(0);
    expect(m.snapshot.status).toBe('suggested');
  });

  it('transitions accept → status=accepted', () => {
    const m = Match.suggest({ id: 'm3', lostItemId: 'a', foundItemId: 'b', imageScore: 0.5, textScore: 0.5, geoScore: 0.5, timeScore: 0.5 });
    m.accept();
    expect(m.snapshot.status).toBe('accepted');
  });

  it('records lost-owner return confirmation', () => {
    const m = Match.suggest({ id: 'm4', lostItemId: 'a', foundItemId: 'b', imageScore: 0.5, textScore: 0.5, geoScore: 0.5, timeScore: 0.5 });
    m.confirmReturnByLost('user-a');
    expect(m.snapshot.returnConfirmedByLost).toBe('user-a');
    expect(m.snapshot.returnConfirmedByFound).toBeUndefined();
    expect(m.snapshot.returnedAt).toBeUndefined();
  });

  it('records found-owner return confirmation', () => {
    const m = Match.suggest({ id: 'm5', lostItemId: 'a', foundItemId: 'b', imageScore: 0.5, textScore: 0.5, geoScore: 0.5, timeScore: 0.5 });
    m.confirmReturnByFound('user-b');
    expect(m.snapshot.returnConfirmedByFound).toBe('user-b');
    expect(m.snapshot.returnConfirmedByLost).toBeUndefined();
    expect(m.snapshot.returnedAt).toBeUndefined();
  });

  it('marks returned when both parties confirm', () => {
    const m = Match.suggest({ id: 'm6', lostItemId: 'a', foundItemId: 'b', imageScore: 0.5, textScore: 0.5, geoScore: 0.5, timeScore: 0.5 });
    m.confirmReturnByLost('user-a');
    m.confirmReturnByFound('user-b');
    m.markReturned();
    expect(m.snapshot.returnConfirmedByLost).toBe('user-a');
    expect(m.snapshot.returnConfirmedByFound).toBe('user-b');
    expect(m.snapshot.returnedAt).toBeInstanceOf(Date);
  });
});
