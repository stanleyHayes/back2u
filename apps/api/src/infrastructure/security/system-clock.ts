import { injectable } from 'inversify';

import type { IClock } from '../../application/ports/services.js';

@injectable()
export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
