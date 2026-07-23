import type { ErrorRequestHandler, Request, Response } from 'express';
import { ZodError } from 'zod';

import { DomainError } from '../../../domain/shared/errors.js';
import type { IErrorReporter } from '../../../application/ports/services.js';

// app.ts mounts `errorHandler` directly (no container), so the reporter is
// registered once at startup by whoever builds the composition root.
let reporter: IErrorReporter | null = null;

export function setErrorReporter(r: IErrorReporter): void {
  reporter = r;
}

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function body(code: string, message: string, details?: unknown): ErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof ZodError) {
    res.status(400).json(body('validation', 'Invalid request', err.flatten()));
    return;
  }

  if (err instanceof DomainError) {
    const details = 'details' in err ? (err.details as unknown) : undefined;
    res.status(err.httpStatus).json(body(err.code, err.message, details));
    return;
  }

  // http-errors style (body-parser JSON syntax errors, payload too large, …)
  const status = Number((err as { status?: unknown; statusCode?: unknown })?.status ??
    (err as { statusCode?: unknown })?.statusCode);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    res.status(status).json(body('bad_request', err instanceof Error ? err.message : 'Bad request'));
    return;
  }

  reporter?.report(err instanceof Error ? err : new Error(String(err)), {
    method: req.method,
    path: req.originalUrl,
  });
  // eslint-disable-next-line no-console
  console.error('[unhandled]', err);
  res.status(500).json(body('internal', 'Internal server error'));
};

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(body('not_found', `Route ${req.method} ${req.path} not found`));
}
