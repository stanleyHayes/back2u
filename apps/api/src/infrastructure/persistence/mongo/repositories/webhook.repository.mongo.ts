import { injectable } from 'inversify';

import type { IWebhookRepository } from '../../../../application/ports/repositories.js';
import { Webhook, type WebhookSnapshot } from '../../../../domain/webhook/webhook.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { WebhookModel, type WebhookDoc } from '../models/webhook.model.js';

const toSnapshot = (d: WebhookDoc): WebhookSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoWebhookRepository implements IWebhookRepository {
  async save(w: Webhook): Promise<void> {
    const { id, ...rest } = w.snapshot;
    await WebhookModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<Webhook | null> {
    const doc = await WebhookModel.findById(id).lean<WebhookDoc | null>();
    return doc ? Webhook.rehydrate(toSnapshot(doc)) : null;
  }

  async listForInstitution(institutionId: Id): Promise<Webhook[]> {
    const docs = await WebhookModel.find({ institutionId })
      .sort({ createdAt: -1 })
      .lean<WebhookDoc[]>();
    return docs.map((d) => Webhook.rehydrate(toSnapshot(d)));
  }

  async delete(id: Id): Promise<void> {
    await WebhookModel.deleteOne({ _id: id });
  }
}
