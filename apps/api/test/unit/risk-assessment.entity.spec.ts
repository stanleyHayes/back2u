import { describe, expect, it } from 'vitest';

import { RiskAssessment } from '../../src/domain/risk/risk-assessment.entity.js';

const record = (over: Partial<Parameters<typeof RiskAssessment.record>[0]> = {}) =>
  RiskAssessment.record({
    id: 'a1',
    subjectId: 'm1',
    ownerId: 'owner',
    finderId: 'finder',
    score: 10,
    band: 'low',
    action: 'clear',
    ruleHits: [],
    ...over,
  });

describe('RiskAssessment', () => {
  it('closes a low-risk recovery out without a reviewer', () => {
    const a = record();
    expect(a.snapshot.reviewStatus).toBe('cleared');
    expect(a.blocksRewards).toBe(false);
  });

  it('closes a medium-risk recovery out — the hold is the response, not a human', () => {
    const a = record({ score: 40, band: 'medium', action: 'extend_hold' });
    expect(a.snapshot.reviewStatus).toBe('cleared');
    expect(a.blocksRewards).toBe(false);
  });

  it('opens a queue entry that blocks rewards for high risk', () => {
    const a = record({ score: 70, band: 'high', action: 'manual_review' });
    expect(a.snapshot.reviewStatus).toBe('open');
    expect(a.blocksRewards).toBe(true);
  });

  it('opens a queue entry that blocks rewards for critical risk', () => {
    expect(record({ score: 95, band: 'critical', action: 'freeze' }).blocksRewards).toBe(true);
  });

  it('stops blocking once a reviewer clears it', () => {
    const a = record({ score: 70, band: 'high', action: 'manual_review' });
    a.review('cleared', 'admin-1', 'known good finder');
    expect(a.blocksRewards).toBe(false);
    expect(a.snapshot.reviewerId).toBe('admin-1');
    expect(a.snapshot.decidedAt).toBeInstanceOf(Date);
  });

  it('stops blocking once fraud is confirmed — the penalty takes over', () => {
    const a = record({ score: 95, band: 'critical', action: 'freeze' });
    a.review('confirmed_fraud', 'admin-1');
    expect(a.snapshot.reviewStatus).toBe('confirmed_fraud');
    expect(a.blocksRewards).toBe(false);
  });

  it('refuses a second review', () => {
    const a = record({ score: 70, band: 'high', action: 'manual_review' });
    a.review('dismissed', 'admin-1');
    expect(() => a.review('cleared', 'admin-2')).toThrow();
  });

  it('hands out a copy of the rule hits', () => {
    const a = record({ ruleHits: [{ code: 'repeat_pair', weight: 22, detail: 'x' }] });
    a.snapshot.ruleHits.push({ code: 'shared_device', weight: 30, detail: 'injected' });
    expect(a.snapshot.ruleHits).toHaveLength(1);
  });
});
