import { injectable } from 'inversify';

import type { ITrustedFinderApplicationRepository } from '../../../../application/ports/repositories.js';
import {
  TrustedFinderApplication,
  type TrustedFinderApplicationSnapshot,
} from '../../../../domain/trusted-finder/trusted-finder-application.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  TrustedFinderApplicationModel,
  type TrustedFinderApplicationDoc,
} from '../models/trusted-finder.model.js';

const toSnapshot = (d: TrustedFinderApplicationDoc): TrustedFinderApplicationSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoTrustedFinderApplicationRepository implements ITrustedFinderApplicationRepository {
  async save(app: TrustedFinderApplication): Promise<void> {
    const { id, ...rest } = app.snapshot;
    await TrustedFinderApplicationModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<TrustedFinderApplication | null> {
    const doc = await TrustedFinderApplicationModel.findById(id).lean<TrustedFinderApplicationDoc | null>();
    return doc ? TrustedFinderApplication.rehydrate(toSnapshot(doc)) : null;
  }

  async findPendingByUserId(userId: Id): Promise<TrustedFinderApplication | null> {
    const doc = await TrustedFinderApplicationModel.findOne({ userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .lean<TrustedFinderApplicationDoc | null>();
    return doc ? TrustedFinderApplication.rehydrate(toSnapshot(doc)) : null;
  }

  async list(
    status?: 'pending' | 'approved' | 'rejected',
    limit = 50,
  ): Promise<TrustedFinderApplication[]> {
    const q: Record<string, unknown> = {};
    if (status) q.status = status;
    const docs = await TrustedFinderApplicationModel.find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<TrustedFinderApplicationDoc[]>();
    return docs.map((d) => TrustedFinderApplication.rehydrate(toSnapshot(d)));
  }
}
