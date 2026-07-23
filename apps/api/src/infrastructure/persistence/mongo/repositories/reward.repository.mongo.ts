import { injectable } from 'inversify';

import type { IRewardRepository } from '../../../../application/ports/repositories.js';
import { Reward, type RewardSnapshot } from '../../../../domain/reward/reward.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { RewardModel, type RewardDoc } from '../models/reward.model.js';

const toSnapshot = (d: RewardDoc): RewardSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoRewardRepository implements IRewardRepository {
  async save(reward: Reward): Promise<void> {
    const { id, ...rest } = reward.snapshot;
    await RewardModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<Reward | null> {
    const doc = await RewardModel.findById(id).lean<RewardDoc | null>();
    return doc ? Reward.rehydrate(toSnapshot(doc)) : null;
  }
}
