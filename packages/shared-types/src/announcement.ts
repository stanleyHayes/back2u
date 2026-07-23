export interface PoliceCaseRefDTO {
  id: string;
  itemId: string;
  caseNumber?: string;
  station?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface SocialShareCardDTO {
  itemId: string;
  url: string;
  imageUrl: string;
  message: string;
}
