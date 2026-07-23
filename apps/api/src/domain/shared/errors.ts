export class DomainError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super('not_found', `${what} not found`, 404);
  }
}

export class ForbiddenError extends DomainError {
  constructor(reason = 'Forbidden') {
    super('forbidden', reason, 403);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(reason = 'Unauthorized') {
    super('unauthorized', reason, 401);
  }
}

export class ConflictError extends DomainError {
  constructor(reason: string) {
    super('conflict', reason, 409);
  }
}

export class ValidationError extends DomainError {
  constructor(reason: string, details?: unknown) {
    super('validation', reason, 422);
    this.details = details;
  }
  details?: unknown;
}

export class TooManyRequestsError extends DomainError {
  constructor(reason = 'Too many requests') {
    super('too_many_requests', reason, 429);
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(reason = 'Service unavailable') {
    super('service_unavailable', reason, 503);
  }
}
