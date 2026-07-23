import * as Sentry from '@sentry/node';
import { inject, injectable } from 'inversify';

import type { IErrorReporter, ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

@injectable()
export class SentryErrorReporter implements IErrorReporter {
  private readonly enabled: boolean;
  constructor(
    @inject(TOKENS.Env) env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    this.enabled = Boolean(env.SENTRY_DSN);
    if (this.enabled) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: 0.1,
      });
    }
  }
  report(error: Error, context: Record<string, unknown> = {}): void {
    if (!this.enabled) {
      this.logger.error('reported (no DSN)', { err: error.message, ...context });
      return;
    }
    Sentry.withScope((scope) => {
      for (const [k, v] of Object.entries(context)) scope.setExtra(k, v);
      Sentry.captureException(error);
    });
  }

  capture(err: unknown, context: Record<string, unknown> = {}): void {
    this.report(err instanceof Error ? err : new Error(String(err)), context);
  }

  captureMessage(message: string, level = 'info'): void {
    if (!this.enabled) {
      this.logger.info(`[sentry] ${message}`);
      return;
    }
    Sentry.captureMessage(message, level as Sentry.SeverityLevel);
  }

  withScope<T>(meta: Record<string, unknown>, fn: () => T): T {
    if (!this.enabled) return fn();
    let result!: T;
    Sentry.withScope((scope) => {
      for (const [k, v] of Object.entries(meta)) scope.setExtra(k, v);
      result = fn();
    });
    return result;
  }
}
