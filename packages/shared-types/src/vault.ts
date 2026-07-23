export interface VaultEntryDTO {
  id: string;
  ownerId: string;
  label: string;
  category: string;
  serialNumber?: string;
  imei?: string;
  receiptImageUrl?: string;
  photoUrls: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultEntryInput {
  label: string;
  category: string;
  serialNumber?: string;
  imei?: string;
  receiptImageUrl?: string;
  photoUrls?: string[];
  notes?: string;
}
