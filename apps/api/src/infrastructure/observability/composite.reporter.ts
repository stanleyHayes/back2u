import { inject, injectable } from 'inversify';

import type { IErrorReporter, ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';
import { LoggingErrorReporter } from './error-reporter.js';
import { SentryErrorReporter } from './sentry.reporter.js';

/**
 * Combines multiple error reporters so that errors are sent to
 * every configured backend (e.g. Sentry + console logs).
 */
@injectable()
export class CompositeErrorReporter implements IErrorReporter {
  private readonly reporters: IErrorReporter[];

  constructor(
    @inject(TOKENS.Env) env: Env,
    @inject(TOKENS.Logger) logger: ILogger,
  ) {
    this.reporters = [new LoggingErrorReporter(logger)];
    if (env.SENTRY_DSN) {
      this.reporters.push(new SentryErrorReporter(env, logger));
    }
  }

  report(error: Error, context?: Record<string, unknown>): void {
    this.reporters.forEach((r) => r.report(error, context));
  }

  capture(err: unknown, context?: Record<string, unknown>): void {
    this.reporters.forEach((r) => r.capture(err, context));
  }

  captureMessage(message: string, level?: string): void {
    this.reporters.forEach((r) => r.captureMessage(message, level));
  }

  withScope<T>(meta: Record<string, unknown>, fn: () => T): T {
    const run = (index: number): T => {
      if (index >= this.reporters.length) return fn();
      const reporter = this.reporters[index]!;
      return reporter.withScope(meta, () => run(index + 1));
    };
    return run(0);
  }
}
