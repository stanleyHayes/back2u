export interface PartnerApiKeyDTO {
  id: string;
  institutionId: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface CreatedPartnerApiKeyDTO {
  id: string;
  institutionId: string;
  name: string;
  plainKey: string;
  createdAt: string;
}
