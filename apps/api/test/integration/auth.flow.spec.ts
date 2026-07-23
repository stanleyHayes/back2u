import 'reflect-metadata';
import './../helpers/test-env.js';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { LoginUserUseCase } from '../../src/application/use-cases/auth/login-user.js';
import { LogoutUseCase, RefreshSessionUseCase } from '../../src/application/use-cases/auth/refresh-session.js';
import { RegisterUserUseCase } from '../../src/application/use-cases/auth/register-user.js';
import { buildContainer } from '../../src/composition/container.js';
import { clearMongo, startMongo, stopMongo } from '../helpers/mongo.js';

describe('Auth flow (integration)', () => {
  let container: ReturnType<typeof buildContainer>;

  beforeAll(async () => {
    await startMongo();
    container = buildContainer();
  });
  afterAll(async () => {
    await stopMongo();
  });
  beforeEach(async () => {
    await clearMongo();
  });

  it('registers, logs in, refreshes, logs out', async () => {
    const reg = await container.get(RegisterUserUseCase).execute({
      email: 'a@b.co',
      password: 'password123',
      name: 'A',
    });
    expect(reg.user.email).toBe('a@b.co');
    expect(reg.tokens.accessToken).toBeTruthy();
    expect(reg.tokens.refreshToken).toBeTruthy();

    const login = await container.get(LoginUserUseCase).execute({
      email: 'a@b.co',
      password: 'password123',
    });
    expect(login.user.id).toBe(reg.user.id);

    const rotated = await container.get(RefreshSessionUseCase).execute(login.tokens.refreshToken);
    expect(rotated.tokens.refreshToken).not.toBe(login.tokens.refreshToken);

    await container.get(LogoutUseCase).execute(rotated.tokens.refreshToken);
    await expect(
      container.get(RefreshSessionUseCase).execute(rotated.tokens.refreshToken),
    ).rejects.toThrow();
  });

  it('rejects duplicate email', async () => {
    await container.get(RegisterUserUseCase).execute({
      email: 'dup@b.co',
      password: 'password123',
      name: 'A',
    });
    await expect(
      container.get(RegisterUserUseCase).execute({
        email: 'dup@b.co',
        password: 'password123',
        name: 'B',
      }),
    ).rejects.toThrow(/registered/i);
  });

  it('rejects bad password on login', async () => {
    await container.get(RegisterUserUseCase).execute({
      email: 'p@b.co',
      password: 'password123',
      name: 'A',
    });
    await expect(
      container.get(LoginUserUseCase).execute({ email: 'p@b.co', password: 'wrong' }),
    ).rejects.toThrow(/invalid/i);
  });
});
