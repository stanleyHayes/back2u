import { injectable } from 'inversify';
import pino, { type Logger as PinoLogger } from 'pino';
import pretty from 'pino-pretty';

import type { ILogger } from '../../application/ports/services.js';

@injectable()
export class PinoAppLogger implements ILogger {
  // In-process pretty stream: the worker-thread transport (pino.transport)
  // crashes under tsx/watch on newer Node versions.
  readonly raw: PinoLogger = pino(
    { level: process.env.LOG_LEVEL ?? 'info' },
    process.env.NODE_ENV !== 'production'
      ? pretty({ colorize: true, translateTime: 'SYS:HH:MM:ss' })
      : undefined,
  );

  info(msg: string, meta: Record<string, unknown> = {}): void {
    this.raw.info(meta, msg);
  }
  warn(msg: string, meta: Record<string, unknown> = {}): void {
    this.raw.warn(meta, msg);
  }
  error(msg: string, meta: Record<string, unknown> = {}): void {
    this.raw.error(meta, msg);
  }
}
