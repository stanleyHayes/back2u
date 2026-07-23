import { inject, injectable } from 'inversify';
import type { Locale, UpdateProfileInput, UserDTO } from '@back2u/shared-types';

import { NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IUserRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { toUserDTO } from './register-user.js';

@injectable()
export class UpdateProfileUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: Id, input: UpdateProfileInput): Promise<UserDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    try {
      user.updateProfile(input);
    } catch (err) {
      throw new ValidationError(err instanceof Error ? err.message : 'Invalid profile');
    }
    await this.users.save(user);
    return toUserDTO(user);
  }
}

@injectable()
export class RegisterPushTokenUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: Id, token: string): Promise<{ ok: true }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    user.addPushToken(token);
    await this.users.save(user);
    return { ok: true };
  }
}

@injectable()
export class SetLocaleUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: Id, locale: Locale): Promise<{ ok: true }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    user.setLocale(locale);
    await this.users.save(user);
    return { ok: true };
  }
}

@injectable()
export class RedeemPointsUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: Id, points: number): Promise<{ pointsBalance: number }> {
    if (!Number.isInteger(points) || points <= 0) {
      throw new ValidationError('Points must be a positive integer');
    }
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (points > user.snapshot.pointsBalance) throw new ValidationError('Insufficient points');
    user.spendPoints(points);
    await this.users.save(user);
    return { pointsBalance: user.snapshot.pointsBalance };
  }
}

@injectable()
export class ExportMyDataUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: Id): Promise<unknown> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    return { user: toUserDTO(user), exportedAt: new Date().toISOString() };
  }
}
