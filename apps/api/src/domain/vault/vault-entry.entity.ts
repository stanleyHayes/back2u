import type { Id } from '../shared/id.js';

export interface VaultEntrySnapshot {
  id: Id;
  ownerId: Id;
  label: string;
  category: string;
  serialNumber?: string;
  imei?: string;
  receiptImageUrl?: string;
  photoUrls: string[];
  notes?: string;
  encryptedBlob?: string; // app-layer encrypted JSON for sensitive bits
  createdAt: Date;
  updatedAt: Date;
}

export class VaultEntry {
  private constructor(private state: VaultEntrySnapshot) {}
  static rehydrate(s: VaultEntrySnapshot): VaultEntry {
    return new VaultEntry({ ...s });
  }
  static create(input: Omit<VaultEntrySnapshot, 'createdAt' | 'updatedAt'>): VaultEntry {
    const now = new Date();
    return new VaultEntry({ ...input, createdAt: now, updatedAt: now });
  }
  get snapshot(): VaultEntrySnapshot {
    return { ...this.state };
  }
  update(patch: Partial<Omit<VaultEntrySnapshot, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.state, patch);
    this.state.updatedAt = new Date();
  }
}
