import { injectable } from 'inversify';

import type { IVaultRepository } from '../../../../application/ports/repositories.js';
import { VaultEntry, type VaultEntrySnapshot } from '../../../../domain/vault/vault-entry.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { VaultEntryModel, type VaultEntryDoc } from '../models/vault.model.js';

const toSnapshot = (d: VaultEntryDoc): VaultEntrySnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoVaultRepository implements IVaultRepository {
  // Snapshots arrive with ciphertext already applied by the use-case layer;
  // the repo persists them verbatim.
  async save(e: VaultEntry): Promise<void> {
    const { id, ...rest } = e.snapshot;
    await VaultEntryModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<VaultEntry | null> {
    const doc = await VaultEntryModel.findById(id).lean<VaultEntryDoc | null>();
    return doc ? VaultEntry.rehydrate(toSnapshot(doc)) : null;
  }

  async listForOwner(ownerId: Id): Promise<VaultEntry[]> {
    const docs = await VaultEntryModel.find({ ownerId })
      .sort({ createdAt: -1 })
      .lean<VaultEntryDoc[]>();
    return docs.map((d) => VaultEntry.rehydrate(toSnapshot(d)));
  }

  async delete(id: Id, ownerId: Id): Promise<void> {
    await VaultEntryModel.deleteOne({ _id: id, ownerId });
  }
}
