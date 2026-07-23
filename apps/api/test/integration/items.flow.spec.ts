import 'reflect-metadata';
import './../helpers/test-env.js';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CreateItemUseCase } from '../../src/application/use-cases/item/create-item.js';
import { GetItemUseCase } from '../../src/application/use-cases/item/get-item.js';
import { ListItemsUseCase } from '../../src/application/use-cases/item/list-items.js';
import { RegisterUserUseCase } from '../../src/application/use-cases/auth/register-user.js';
import { buildContainer } from '../../src/composition/container.js';
import { registerWorkerHandlers } from '../../src/infrastructure/queue/job-handlers.js';
import { clearMongo, startMongo, stopMongo } from '../helpers/mongo.js';

describe('Items flow (integration)', () => {
  let container: ReturnType<typeof buildContainer>;
  let userId: string;

  beforeAll(async () => {
    await startMongo();
    container = buildContainer();
    registerWorkerHandlers(container);
  });
  afterAll(async () => stopMongo());
  beforeEach(async () => {
    await clearMongo();
    const reg = await container.get(RegisterUserUseCase).execute({
      email: 'a@b.co',
      password: 'password123',
      name: 'A',
    });
    userId = reg.user.id;
  });

  it('creates an item, fetches it, lists it', async () => {
    const created = await container.get(CreateItemUseCase).execute(
      {
        kind: 'lost',
        classification: 'lost',
        title: 'Black backpack',
        description: 'red zipper',
        category: 'Bag',
        images: [{ url: 'https://example.com/x.jpg', publicId: 'p' }],
        place: { name: 'KNUST', point: { type: 'Point', coordinates: [-1.567, 6.673] } },
        occurredAt: new Date().toISOString(),
      },
      userId,
    );
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('open');

    const got = await container.get(GetItemUseCase).execute(created.id);
    expect(got.title).toBe('Black backpack');

    const list = await container.get(ListItemsUseCase).execute({});
    expect(list.total).toBe(1);
    expect(list.items[0]!.id).toBe(created.id);
  });

  it('filters by kind + text', async () => {
    const exec = (kind: 'lost' | 'found', title: string) =>
      container.get(CreateItemUseCase).execute(
        {
          kind,
          classification: 'lost',
          title,
          description: 'd',
          category: 'Bag',
          images: [{ url: 'u', publicId: 'p' }],
          place: { name: 'p', point: { type: 'Point', coordinates: [-1, 6] } },
          occurredAt: new Date().toISOString(),
        },
        userId,
      );
    await exec('lost', 'wallet');
    await exec('found', 'phone');

    const lost = await container.get(ListItemsUseCase).execute({ kind: 'lost' });
    expect(lost.total).toBe(1);
    expect(lost.items[0]!.title).toBe('wallet');
  });
});
