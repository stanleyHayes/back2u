import { inject, injectable } from 'inversify';
import webpush from 'web-push';

import type { IWebPushService } from '../../application/ports/extra-services.js';
import type { IErrorReporter, ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

@injectable()
export class WebPushService implements IWebPushService {
  private readonly enabled: boolean;
  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.ErrorReporter) private readonly reporter: IErrorReporter,
  ) {
    this.enabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
    if (this.enabled) {
      webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
    }
  }

  async send(
    subscription: unknown,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.info('webpush noop (no VAPID keys)', { title });
      return;
    }
    try {
      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        JSON.stringify({ title, body, data }),
      );
    } catch (err) {
      this.logger.warn('webpush send failed', { err: String(err) });
      // 404/410 means the subscription expired (benign); report anything else.
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode !== 404 && statusCode !== 410) {
        this.reporter.report(err instanceof Error ? err : new Error(String(err)), { channel: 'push.web', statusCode });
      }
    }
  }

  vapidPublicKey(): string | null {
    return this.env.VAPID_PUBLIC_KEY ?? null;
  }
}
