import type { Container } from 'inversify';
import type { UserRole } from '@back2u/shared-types';

import { TOKENS } from '../application/ports/tokens.js';
import type { ITokenService } from '../application/ports/services.js';

export function getAuthToken(
  container: Container,
  userId: string,
  roles: UserRole[] = ['user'],
  email = 'test@example.com',
): string {
  const tokens = container.get<ITokenService>(TOKENS.TokenService);
  const access = tokens.signAccess({ sub: userId, roles, email });
  return access.token;
}
