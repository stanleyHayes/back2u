import { injectable } from 'inversify';

import type { IPartnerApiKeyRepository } from '../../../../application/ports/repositories.js';
import {
  PartnerApiKey,
  type PartnerApiKeySnapshot,
} from '../../../../domain/institution/partner-api-key.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  PartnerApiKeyModel,
  type PartnerApiKeyDoc,
} from '../models/partner-api-key.model.js';

const toSnapshot = (d: PartnerApiKeyDoc): PartnerApiKeySnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoPartnerApiKeyRepository implements IPartnerApiKeyRepository {
  async save(key: PartnerApiKey): Promise<void> {
    const { id, ...rest } = key.snapshot;
    await PartnerApiKeyModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<PartnerApiKey | null> {
    const doc = await PartnerApiKeyModel.findById(id).lean<PartnerApiKeyDoc | null>();
    return doc ? PartnerApiKey.rehydrate(toSnapshot(doc)) : null;
  }

  async findByKeyHash(keyHash: string): Promise<PartnerApiKey | null> {
    const doc = await PartnerApiKeyModel.findOne({ keyHash }).lean<PartnerApiKeyDoc | null>();
    return doc ? PartnerApiKey.rehydrate(toSnapshot(doc)) : null;
  }

  async listByInstitution(institutionId: Id): Promise<PartnerApiKey[]> {
    const docs = await PartnerApiKeyModel.find({ institutionId })
      .sort({ createdAt: -1 })
      .lean<PartnerApiKeyDoc[]>();
    return docs.map((d) => PartnerApiKey.rehydrate(toSnapshot(d)));
  }

  async listAll(): Promise<PartnerApiKey[]> {
    const docs = await PartnerApiKeyModel.find().sort({ createdAt: -1 }).lean<PartnerApiKeyDoc[]>();
    return docs.map((d) => PartnerApiKey.rehydrate(toSnapshot(d)));
  }

  async delete(id: Id): Promise<void> {
    await PartnerApiKeyModel.deleteOne({ _id: id });
  }
}
