import { createHmac, randomBytes } from 'node:crypto';

import type { CreateWebhookInput, UpdateWebhookInput, WebhookDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { Webhook } from '../../../domain/webhook/webhook.entity.js';
import type { IWebhookRepository } from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const DELIVERY_TIMEOUT_MS = 10_000;

function toDTO(w: Webhook): WebhookDTO {
  const s = w.snapshot;
  return {
    id: s.id,
    institutionId: s.institutionId,
    url: s.url,
    events: s.events,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

@injectable()
export class CreateWebhookUseCase {
  constructor(@inject(TOKENS.WebhookRepository) private readonly repo: IWebhookRepository) {}

  async execute(institutionId: Id, input: CreateWebhookInput): Promise<WebhookDTO & { secret: string }> {
    const secret = randomBytes(32).toString('hex');
    const webhook = Webhook.create({ id: newId(), institutionId, url: input.url, secret, events: input.events });
    await this.repo.save(webhook);
    // The secret is returned once at creation; only the HMAC is usable afterwards.
    return { ...toDTO(webhook), secret };
  }
}

@injectable()
export class ListWebhooksUseCase {
  constructor(@inject(TOKENS.WebhookRepository) private readonly repo: IWebhookRepository) {}

  async execute(institutionId: Id): Promise<WebhookDTO[]> {
    const list = await this.repo.listForInstitution(institutionId);
    return list.map(toDTO);
  }
}

@injectable()
export class UpdateWebhookUseCase {
  constructor(@inject(TOKENS.WebhookRepository) private readonly repo: IWebhookRepository) {}

  async execute(id: Id, institutionId: Id, input: UpdateWebhookInput): Promise<WebhookDTO> {
    const webhook = await this.repo.findById(id);
    if (!webhook || webhook.snapshot.institutionId !== institutionId) throw new NotFoundError('Webhook');
    webhook.update(input);
    await this.repo.save(webhook);
    return toDTO(webhook);
  }
}

@injectable()
export class DeleteWebhookUseCase {
  constructor(@inject(TOKENS.WebhookRepository) private readonly repo: IWebhookRepository) {}

  async execute(id: Id, institutionId: Id): Promise<void> {
    const webhook = await this.repo.findById(id);
    if (!webhook || webhook.snapshot.institutionId !== institutionId) throw new NotFoundError('Webhook');
    await this.repo.delete(id);
  }
}

@injectable()
export class DeliverWebhookUseCase {
  constructor(
    @inject(TOKENS.WebhookRepository) private readonly repo: IWebhookRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  /** Route-facing test delivery: POST a `webhook.test` event to one webhook. */
  async execute(webhookId: Id, institutionId: Id): Promise<{ delivered: boolean; status?: number }> {
    const webhook = await this.repo.findById(webhookId);
    if (!webhook || webhook.snapshot.institutionId !== institutionId) throw new NotFoundError('Webhook');
    return this.deliver(webhook, 'webhook.test', { webhookId, message: 'Test delivery from back2u' });
  }

  /** Event fan-out for domain flows (match, courier, bids): hit every active subscriber. */
  async deliverEvent(institutionId: Id, event: string, payload: unknown): Promise<void> {
    const hooks = await this.repo.listForInstitution(institutionId);
    const targets = hooks.filter((h) => h.snapshot.active && h.snapshot.events.includes(event));
    await Promise.all(targets.map((h) => this.deliver(h, event, payload)));
  }

  private async deliver(hook: Webhook, event: string, payload: unknown): Promise<{ delivered: boolean; status?: number }> {
    const s = hook.snapshot;
    const body = JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() });
    const signature = createHmac('sha256', s.secret).update(body).digest('hex');
    try {
      const res = await fetch(s.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-back2u-event': event,
          'x-back2u-signature': `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn('webhook delivery failed', { webhookId: s.id, event, status: res.status });
      }
      return { delivered: res.ok, status: res.status };
    } catch (err) {
      this.logger.warn('webhook delivery error', { webhookId: s.id, event, err: String(err) });
      return { delivered: false };
    }
  }
}
