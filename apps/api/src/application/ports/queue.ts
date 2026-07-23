export type JobName =
  | 'match.generate'
  | 'zone.fanout'
  | 'push.broadcast'
  | 'webpush.send'
  | 'audit.write'
  | 'marketplace.auto-close'
  | 'items.auto-archive'
  | 'marketplace.ending-soon';

export interface IQueue {
  enqueue<T = unknown>(name: JobName, data: T, opts?: { delayMs?: number; jobId?: string }): Promise<void>;
  scheduleJob<T = unknown>(name: JobName, data: T, repeat: { every: number }): Promise<void>;
  close(): Promise<void>;
}

export interface IQueueWorker {
  on<T = unknown>(name: JobName, handler: (data: T) => Promise<void>): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
