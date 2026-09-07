import { describe, expect, it } from 'vitest';

import { PointLedgerEntry } from '../../src/domain/points/point-ledger-entry.entity.js';

const NOW = new Date('2026-09-07T12:00:00Z');
const LATER = new Date('2026-09-20T12:00:00Z');

const pending = () =>
  PointLedgerEntry.pending({
    id: 'e1',
    userId: 'u1',
    action: 'recovery_ordinary',
    points: 25,
    basePoints: 25,
    multiplier: 1,
    pendingUntil: new Date('2026-09-14T12:00:00Z'),
    caseRef: 'm1',
    counterpartyId: 'u2',
  });

describe('PointLedgerEntry', () => {
  it('starts pending and out of the balance', () => {
    const e = pending();
    expect(e.status).toBe('pending');
    expect(e.snapshot.clearedAt).toBeUndefined();
  });

  it('is due only once the holding period has elapsed', () => {
    const e = pending();
    expect(e.isDue(NOW)).toBe(false);
    expect(e.isDue(LATER)).toBe(true);
  });

  it('clears exactly once', () => {
    const e = pending();
    e.clear();
    expect(e.status).toBe('cleared');
    expect(e.snapshot.clearedAt).toBeInstanceOf(Date);
    expect(() => e.clear()).toThrow();
  });

  it('reverses a cleared entry without altering its points', () => {
    const e = pending();
    e.clear();
    e.reverse('confirmed fraud');
    expect(e.status).toBe('reversed');
    expect(e.points).toBe(25);
    expect(e.snapshot.resolutionNote).toBe('confirmed fraud');
  });

  it('reverses a pending entry before it ever reaches the balance', () => {
    const e = pending();
    e.reverse('withdrawn');
    expect(e.status).toBe('reversed');
  });

  it('refuses to reverse twice or to reverse a cancelled entry', () => {
    const e = pending();
    e.reverse('once');
    expect(() => e.reverse('twice')).toThrow();

    const other = pending();
    other.cancel('duplicate');
    expect(() => other.reverse('nope')).toThrow();
  });

  it('cancels only while pending', () => {
    const e = pending();
    e.clear();
    expect(() => e.cancel('too late')).toThrow();
  });

  it('never clears a cancelled entry', () => {
    const e = pending();
    e.cancel('duplicate');
    expect(() => e.clear()).toThrow();
  });

  it('extends a hold forward but never pulls it earlier', () => {
    const e = pending();
    e.extendHold(LATER);
    expect(e.snapshot.pendingUntil).toEqual(LATER);
    e.extendHold(NOW);
    expect(e.snapshot.pendingUntil).toEqual(LATER);
  });

  it('refuses to hold an entry that already cleared', () => {
    const e = pending();
    e.clear();
    expect(() => e.extendHold(LATER)).toThrow();
  });

  it('settles an immediate movement as already cleared', () => {
    const e = PointLedgerEntry.settled({
      id: 'e2',
      userId: 'u1',
      action: 'admin_adjustment',
      points: -50,
      resolutionNote: 'manual correction',
    });
    expect(e.status).toBe('cleared');
    expect(e.points).toBe(-50);
    expect(e.snapshot.clearedAt).toBeInstanceOf(Date);
  });

  it('hands out copies, so a caller cannot mutate ledger history', () => {
    const e = pending();
    const snapshot = e.snapshot;
    snapshot.points = 9999;
    snapshot.reasons.push({ code: 'base', detail: 'injected' });
    expect(e.points).toBe(25);
    expect(e.snapshot.reasons).toHaveLength(0);
  });
});
