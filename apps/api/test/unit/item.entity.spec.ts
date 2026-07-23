import { describe, expect, it } from 'vitest';

import { Item } from '../../src/domain/item/item.entity.js';

const seed = () =>
  Item.create({
    id: 'i1',
    kind: 'lost',
    classification: 'lost',
    title: 'Wallet',
    description: 'brown leather',
    category: 'Wallet',
    tags: [],
    images: [],
    place: { name: 'KNUST', point: { type: 'Point', coordinates: [-1.567, 6.673] } },
    occurredAt: new Date(),
    postedById: 'u1',
  });

describe('Item', () => {
  it('starts open', () => {
    expect(seed().snapshot.status).toBe('open');
  });

  it('attachReward only once', () => {
    const i = seed();
    i.attachReward('r1');
    expect(() => i.attachReward('r2')).toThrow();
  });

  it('markMatched blocked from terminal states', () => {
    const i = seed();
    i.markReturned();
    expect(() => i.markMatched()).toThrow();
  });

  it('setEmbeddings stores both vectors', () => {
    const i = seed();
    i.setEmbeddings([1, 2, 3], [4, 5, 6]);
    expect(i.snapshot.textEmbedding).toEqual([1, 2, 3]);
    expect(i.snapshot.imageEmbedding).toEqual([4, 5, 6]);
  });

  it('markDuplicateOf records pointer', () => {
    const i = seed();
    i.markDuplicateOf('i2');
    expect(i.snapshot.duplicateOfId).toBe('i2');
  });
});
