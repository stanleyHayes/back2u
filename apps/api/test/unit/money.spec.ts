import { describe, expect, it } from 'vitest';

import { fromMajor, money, toMajor } from '../../src/domain/money/money.js';

describe('Money', () => {
  it('rejects floats', () => {
    expect(() => money(10.5 as unknown as number)).toThrow();
  });
  it('round-trips through major', () => {
    expect(toMajor(fromMajor(12.34))).toBeCloseTo(12.34, 5);
  });
  it('rejects negative values', () => {
    expect(() => money(-1)).toThrow();
  });
});
