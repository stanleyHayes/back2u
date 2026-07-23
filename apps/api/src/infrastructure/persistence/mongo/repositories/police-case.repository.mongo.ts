import { injectable } from 'inversify';

import type { IPoliceCaseRepository } from '../../../../application/ports/repositories.js';
import {
  PoliceCase,
  type PoliceCaseSnapshot,
} from '../../../../domain/announcement/police-case.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { PoliceCaseModel, type PoliceCaseDoc } from '../models/police-case.model.js';

const toSnapshot = (d: PoliceCaseDoc): PoliceCaseSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoPoliceCaseRepository implements IPoliceCaseRepository {
  async save(p: PoliceCase): Promise<void> {
    const { id, ...rest } = p.snapshot;
    await PoliceCaseModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<PoliceCase | null> {
    const doc = await PoliceCaseModel.findById(id).lean<PoliceCaseDoc | null>();
    return doc ? PoliceCase.rehydrate(toSnapshot(doc)) : null;
  }

  async findByItemId(itemId: Id): Promise<PoliceCase | null> {
    const doc = await PoliceCaseModel.findOne({ itemId }).lean<PoliceCaseDoc | null>();
    return doc ? PoliceCase.rehydrate(toSnapshot(doc)) : null;
  }
}
