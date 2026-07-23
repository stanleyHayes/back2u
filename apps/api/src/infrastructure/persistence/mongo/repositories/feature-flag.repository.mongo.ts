import { injectable } from 'inversify';

import type { IFeatureFlagRepository } from '../../../../application/ports/repositories.js';
import {
  FeatureFlag,
  type FeatureFlagSnapshot,
} from '../../../../domain/feature-flag/feature-flag.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { FeatureFlagModel, type FeatureFlagDoc } from '../models/feature-flag.model.js';

const toSnapshot = (d: FeatureFlagDoc): FeatureFlagSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoFeatureFlagRepository implements IFeatureFlagRepository {
  async save(flag: FeatureFlag): Promise<void> {
    const { id, ...rest } = flag.snapshot;
    await FeatureFlagModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<FeatureFlag | null> {
    const doc = await FeatureFlagModel.findById(id).lean<FeatureFlagDoc | null>();
    return doc ? FeatureFlag.rehydrate(toSnapshot(doc)) : null;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const doc = await FeatureFlagModel.findOne({ key }).lean<FeatureFlagDoc | null>();
    return doc ? FeatureFlag.rehydrate(toSnapshot(doc)) : null;
  }

  async listAll(): Promise<FeatureFlag[]> {
    const docs = await FeatureFlagModel.find().sort({ key: 1 }).lean<FeatureFlagDoc[]>();
    return docs.map((d) => FeatureFlag.rehydrate(toSnapshot(d)));
  }
}
