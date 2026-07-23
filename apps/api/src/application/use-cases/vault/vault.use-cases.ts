import type { CreateVaultEntryInput, VaultEntryDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { newId, type Id } from '../../../domain/shared/id.js';
import { VaultEntry } from '../../../domain/vault/vault-entry.entity.js';
import type { IVaultCipher } from '../../ports/crypto.js';
import type { IVaultRepository } from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

interface SensitiveFields {
  serialNumber?: string;
  imei?: string;
  notes?: string;
}

async function toDTO(entry: VaultEntry, cipher: IVaultCipher, logger: ILogger): Promise<VaultEntryDTO> {
  const s = entry.snapshot;
  let sensitive: SensitiveFields = {};
  if (s.encryptedBlob) {
    try {
      sensitive = JSON.parse(await cipher.decrypt(s.encryptedBlob, s.ownerId)) as SensitiveFields;
    } catch (err) {
      logger.warn('vault entry decrypt failed', { entryId: s.id, err: String(err) });
    }
  }
  return {
    id: s.id,
    ownerId: s.ownerId,
    label: s.label,
    category: s.category,
    serialNumber: sensitive.serialNumber ?? s.serialNumber,
    imei: sensitive.imei ?? s.imei,
    receiptImageUrl: s.receiptImageUrl,
    photoUrls: s.photoUrls,
    notes: sensitive.notes ?? s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

@injectable()
export class CreateVaultEntryUseCase {
  constructor(
    @inject(TOKENS.VaultRepository) private readonly repo: IVaultRepository,
    @inject(TOKENS.VaultCipher) private readonly cipher: IVaultCipher,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(ownerId: Id, input: CreateVaultEntryInput): Promise<VaultEntryDTO> {
    const sensitive: SensitiveFields = {
      serialNumber: input.serialNumber,
      imei: input.imei,
      notes: input.notes,
    };
    const hasSensitive = Object.values(sensitive).some((v) => v !== undefined);
    // When the cipher is configured, sensitive fields only ever rest inside the blob.
    const encrypt = hasSensitive && this.cipher.isReady();
    const entry = VaultEntry.create({
      id: newId(),
      ownerId,
      label: input.label,
      category: input.category,
      serialNumber: encrypt ? undefined : input.serialNumber,
      imei: encrypt ? undefined : input.imei,
      receiptImageUrl: input.receiptImageUrl,
      photoUrls: input.photoUrls ?? [],
      notes: encrypt ? undefined : input.notes,
      encryptedBlob: encrypt ? await this.cipher.encrypt(JSON.stringify(sensitive), ownerId) : undefined,
    });
    await this.repo.save(entry);
    return toDTO(entry, this.cipher, this.logger);
  }
}

@injectable()
export class ListVaultEntriesUseCase {
  constructor(
    @inject(TOKENS.VaultRepository) private readonly repo: IVaultRepository,
    @inject(TOKENS.VaultCipher) private readonly cipher: IVaultCipher,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(ownerId: Id): Promise<VaultEntryDTO[]> {
    const list = await this.repo.listForOwner(ownerId);
    return Promise.all(list.map((e) => toDTO(e, this.cipher, this.logger)));
  }
}

@injectable()
export class DeleteVaultEntryUseCase {
  constructor(@inject(TOKENS.VaultRepository) private readonly repo: IVaultRepository) {}

  async execute(id: Id, ownerId: Id): Promise<void> {
    await this.repo.delete(id, ownerId);
  }
}
