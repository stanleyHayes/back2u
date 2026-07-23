import type { NextFunction, Request, Response } from 'express';

interface Metric {
  count: number;
  totalMs: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  latencies: number[];
}

const metrics = new Map<string, Metric>();
const MAX_LATENCIES = 1000;
const SLOW_THRESHOLD_MS = 1000;

function getKey(req: Request): string {
  return `${req.method} ${req.route?.path ?? req.path}`;
}

function record(key: string, ms: number): void {
  let m = metrics.get(key);
  if (!m) {
    m = { count: 0, totalMs: 0, avgMs: 0, p95Ms: 0, maxMs: 0, latencies: [] };
    metrics.set(key, m);
  }
  m.count++;
  m.totalMs += ms;
  m.avgMs = m.totalMs / m.count;
  m.maxMs = Math.max(m.maxMs, ms);
  m.latencies.push(ms);
  if (m.latencies.length > MAX_LATENCIES) {
    m.latencies.shift();
  }
  const sorted = [...m.latencies].sort((a, b) => a - b);
  const p95Idx = Math.ceil(sorted.length * 0.95) - 1;
  m.p95Ms = sorted[Math.max(0, p95Idx)] ?? 0;
}

export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  // Headers must be set before the response is flushed, so hook res.end rather
  // than the 'finish' event (by then headers are already sent).
  const end = res.end.bind(res);
  res.end = ((...args: unknown[]) => {
    if (!res.headersSent) {
      const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
      res.setHeader('X-Response-Time', `${ms.toFixed(2)}ms`);
    }
    return (end as (...a: unknown[]) => unknown)(...args);
  }) as Response['end'];
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    const key = getKey(req);
    record(key, ms);
    if (ms > SLOW_THRESHOLD_MS) {
      // eslint-disable-next-line no-console
      console.warn(`[SLOW] ${key} took ${ms.toFixed(2)}ms`);
    }
  });
  next();
}

export function getMetrics(): Record<string, Omit<Metric, 'latencies'>> {
  const out: Record<string, Omit<Metric, 'latencies'>> = {};
  for (const [key, m] of metrics) {
    const { latencies: _, ...rest } = m;
    out[key] = rest;
  }
  return out;
}

export function resetMetrics(): void {
  metrics.clear();
}
