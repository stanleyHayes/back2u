import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClearPendingPointsUseCase } from '../../src/application/use-cases/points/points.use-cases.js';
import { PointLedgerEntry } from '../../src/domain/points/point-ledger-entry.entity.js';
import { BusinessRules } from '../../src/domain/rules/business-rules.entity.js';

const NOW = new Date('2026-09-20T12:00:00Z');

const duePending = () =>
  PointLedgerEntry.pending({
    id: 'e1',
    userId: 'u1',
    action: 'recovery_ordinary',
    points: 25,
    basePoints: 25,
    multiplier: 1,
    pendingUntil: new Date('2026-09-14T12:00:00Z'),
    caseRef: 'case1',
  });

/** Builds a use case over stub collaborators, exposing the ones under test. */
const build = (over: { entries?: PointLedgerEntry[]; blocked?: boolean } = {}) => {
  const entries = over.entries ?? [duePending()];
  const ledger = {
    findDue: vi.fn().mockResolvedValue(entries),
    claimForClearing: vi.fn().mockResolvedValue(true),
    markCredited: vi.fn().mockResolvedValue(undefined),
    releaseClaim: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const users = {
    incrementPoints: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
  };
  const risks = {
    findBySubject: vi
      .fn()
      .mockResolvedValue(over.blocked ? { blocksRewards: true } : { blocksRewards: false }),
  };
  const rulesRepo = { get: vi.fn().mockResolvedValue(BusinessRules.createDefault()) };
  const notifications = { save: vi.fn().mockResolvedValue(undefined) };
  const bus = { publishToUser: vi.fn() };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const useCase = new ClearPendingPointsUseCase(
    ledger as never,
    risks as never,
    rulesRepo as never,
    users as never,
    notifications as never,
    bus as never,
    logger as never,
  );
  return { useCase, ledger, users, risks, logger };
};

describe('ClearPendingPointsUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('claims the entry before crediting, and marks it credited after', async () => {
    const { useCase, ledger, users } = build();
    const result = await useCase.execute(NOW);

    expect(ledger.claimForClearing).toHaveBeenCalledWith('e1', NOW);
    expect(users.incrementPoints).toHaveBeenCalledWith('u1', 25);
    expect(ledger.markCredited).toHaveBeenCalledWith('e1', NOW);
    expect(result).toEqual({ cleared: 1, held: 0 });
  });

  it('credits with an atomic increment, never a whole-document save', async () => {
    const { useCase, users } = build();
    await useCase.execute(NOW);
    // A read-modify-write here would silently revert concurrent user updates.
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('skips an entry another pass already claimed rather than double-crediting', async () => {
    const { useCase, ledger, users } = build();
    ledger.claimForClearing.mockResolvedValue(false);

    const result = await useCase.execute(NOW);
    expect(users.incrementPoints).not.toHaveBeenCalled();
    expect(result.cleared).toBe(0);
  });

  it('returns a failed credit to the queue instead of stranding the points', async () => {
    const { useCase, ledger, users } = build();
    users.incrementPoints.mockRejectedValue(new Error('write conflict'));

    const result = await useCase.execute(NOW);
    expect(ledger.releaseClaim).toHaveBeenCalledWith('e1', expect.any(Date));
    expect(ledger.markCredited).not.toHaveBeenCalled();
    // The entry must not be reported as cleared when the money never moved.
    expect(result.cleared).toBe(0);
  });

  it('finishes a credit that a previous pass claimed but never applied', async () => {
    const stranded = duePending();
    stranded.clear(); // claimed, but creditedAt was never set
    const { useCase, ledger, users } = build({ entries: [stranded] });

    const result = await useCase.execute(NOW);
    // Already claimed, so no second claim — but the credit still lands.
    expect(ledger.claimForClearing).not.toHaveBeenCalled();
    expect(users.incrementPoints).toHaveBeenCalledWith('u1', 25);
    expect(result.cleared).toBe(1);
  });

  it('holds an entry whose recovery is under investigation', async () => {
    const { useCase, ledger, users } = build({ blocked: true });
    const result = await useCase.execute(NOW);

    expect(users.incrementPoints).not.toHaveBeenCalled();
    expect(ledger.claimForClearing).not.toHaveBeenCalled();
    expect(result).toEqual({ cleared: 0, held: 1 });
  });

  it('marks a zero-point entry credited without touching the balance', async () => {
    const zero = PointLedgerEntry.pending({
      id: 'e0',
      userId: 'u1',
      action: 'recovery_ordinary',
      points: 0,
      basePoints: 25,
      multiplier: 0,
      pendingUntil: new Date('2026-09-14T12:00:00Z'),
    });
    const { useCase, ledger, users } = build({ entries: [zero] });

    await useCase.execute(NOW);
    expect(users.incrementPoints).not.toHaveBeenCalled();
    expect(ledger.markCredited).toHaveBeenCalledWith('e0', NOW);
  });
});
