import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}

/** Wrap an async route handler so rejections reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Express 5 types params as `string | string[]`; routes always want a scalar. */
export function param(req: Request, name: string): string {
  const v = req.params[name];
  return (Array.isArray(v) ? v[0] : v) as string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
}

export function parsePagination(req: Request, defaultPageSize = 20, maxPageSize = 100): Pagination {
  const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
  const raw = Number.parseInt(req.query.pageSize as string, 10) || defaultPageSize;
  const pageSize = Math.min(maxPageSize, Math.max(1, raw));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
