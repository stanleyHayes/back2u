import argon2 from 'argon2';
import { injectable } from 'inversify';

import type { IPasswordHasher } from '../../application/ports/services.js';

@injectable()
export class Argon2Hasher implements IPasswordHasher {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }
  verify(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
