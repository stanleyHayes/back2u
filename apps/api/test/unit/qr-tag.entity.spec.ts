import { describe, expect, it } from 'vitest';

import { QrTag } from '../../src/domain/tag/qr-tag.entity.js';

describe('QrTag', () => {
  it('mints unclaimed', () => {
    const t = QrTag.mint({ id: 't1', code: 'ABCDEFGH' });
    expect(t.snapshot.status).toBe('unclaimed');
    expect(t.snapshot.ownerId).toBeUndefined();
  });
  it('claim transitions to active and stores owner + label', () => {
    const t = QrTag.mint({ id: 't1', code: 'X' });
    t.claim('u1', 'Laptop');
    expect(t.snapshot.status).toBe('active');
    expect(t.snapshot.ownerId).toBe('u1');
    expect(t.snapshot.itemLabel).toBe('Laptop');
  });
  it('markLost / disable / heartbeat', () => {
    const t = QrTag.mint({ id: 't1', code: 'Y' });
    t.claim('u', 'L');
    t.markLost();
    expect(t.snapshot.status).toBe('lost');
    t.recordHeartbeat({ type: 'Point', coordinates: [-0.1, 5.6] });
    expect(t.snapshot.lastSeenPoint?.coordinates).toEqual([-0.1, 5.6]);
    t.disable();
    expect(t.snapshot.status).toBe('disabled');
  });
});
