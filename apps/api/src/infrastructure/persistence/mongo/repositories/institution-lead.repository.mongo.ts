import { injectable } from 'inversify';

import type { IInstitutionLeadRepository } from '../../../../application/ports/repositories.js';
import {
  InstitutionLead,
  type InstitutionLeadSnapshot,
} from '../../../../domain/institution/institution-lead.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { InstitutionLeadModel } from '../models/institution-lead.model.js';

type InstitutionLeadDoc = Omit<InstitutionLeadSnapshot, 'id'> & { _id: unknown };

const toSnapshot = (d: InstitutionLeadDoc): InstitutionLeadSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoInstitutionLeadRepository implements IInstitutionLeadRepository {
  async save(lead: InstitutionLead): Promise<void> {
    const { id, ...rest } = lead.snapshot;
    await InstitutionLeadModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<InstitutionLead | null> {
    const doc = await InstitutionLeadModel.findById(id).lean<InstitutionLeadDoc>();
    return doc ? InstitutionLead.rehydrate(toSnapshot(doc)) : null;
  }

  async list(limit?: number): Promise<InstitutionLead[]> {
    let query = InstitutionLeadModel.find({}).sort({ createdAt: -1 });
    if (limit) query = query.limit(limit);
    const docs = await query.lean<InstitutionLeadDoc[]>();
    return docs.map((d) => InstitutionLead.rehydrate(toSnapshot(d)));
  }
}
