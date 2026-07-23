import { injectable } from 'inversify';

import type { IInstitutionRepository } from '../../../../application/ports/repositories.js';
import {
  Institution,
  type InstitutionSnapshot,
} from '../../../../domain/institution/institution.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { InstitutionModel } from '../models/institution.model.js';

type InstitutionDoc = Omit<InstitutionSnapshot, 'id'> & { _id: unknown };

const toSnapshot = (d: InstitutionDoc): InstitutionSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoInstitutionRepository implements IInstitutionRepository {
  async save(i: Institution): Promise<void> {
    const { id, ...rest } = i.snapshot;
    await InstitutionModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<Institution | null> {
    const doc = await InstitutionModel.findById(id).lean<InstitutionDoc>();
    return doc ? Institution.rehydrate(toSnapshot(doc)) : null;
  }

  async list(limit?: number): Promise<Institution[]> {
    let query = InstitutionModel.find({}).sort({ createdAt: -1 });
    if (limit) query = query.limit(limit);
    const docs = await query.lean<InstitutionDoc[]>();
    return docs.map((d) => Institution.rehydrate(toSnapshot(d)));
  }

  async count(): Promise<number> {
    return InstitutionModel.countDocuments({});
  }
}
