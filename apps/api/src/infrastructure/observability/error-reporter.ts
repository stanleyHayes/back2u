import { inject, injectable } from 'inversify';

import type { IErrorReporter, ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';

/**
 * Slim error-reporter port. Wire to Sentry / Datadog by importing their SDK
 * here and feeding `captureException`/`addBreadcrumb`. The contract is intentionally
 * thin so swapping providers is a one-file change.
 */
@injectable()
export class LoggingErrorReporter implements IErrorReporter {
  constructor(@inject(TOKENS.Logger) private readonly logger: ILogger) {}

  report(error: Error, context: Record<string, unknown> = {}): void {
    this.logger.error('reported error', { err: error.message, stack: error.stack, ...context });
  }

  capture(err: unknown, context: Record<string, unknown> = {}): void {
    this.report(err instanceof Error ? err : new Error(String(err)), context);
  }

  captureMessage(message: string, level = 'info'): void {
    this.logger[level === 'error' || level === 'fatal' ? 'error' : 'info'](`[reporter] ${message}`);
  }

  withScope<T>(_meta: Record<string, unknown>, fn: () => T): T {
    return fn();
  }
}
