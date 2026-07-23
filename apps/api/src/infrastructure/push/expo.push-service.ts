import { inject, injectable } from 'inversify';

import type { IErrorReporter, IPushService, ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

@injectable()
export class ExpoPushService implements IPushService {
  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.ErrorReporter) private readonly reporter: IErrorReporter,
  ) {}
  async send(tokens: string[], title: string, body: string, data: Record<string, unknown> = {}): Promise<void> {
    if (tokens.length === 0) return;
    const messages = tokens.map((to) => ({ to, title, body, data, sound: 'default', priority: 'high' }));
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      };
      if (this.env.EXPO_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${this.env.EXPO_ACCESS_TOKEN}`;
      }
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn('expo push failed', { status: res.status });
        this.reporter.report(new Error(`Expo push failed: ${res.status}`), {
          channel: 'push.expo',
          status: res.status,
          recipients: tokens.length,
        });
      }
    } catch (err) {
      this.logger.warn('expo push error', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), { channel: 'push.expo', recipients: tokens.length });
    }
  }
}
