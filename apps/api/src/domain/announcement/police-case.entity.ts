import type { Id } from '../shared/id.js';

export interface PoliceCaseSnapshot {
  id: Id;
  itemId: Id;
  caseNumber?: string;
  station?: string;
  pdfUrl?: string;
  filedAt?: Date;
  createdAt: Date;
}

export class PoliceCase {
  private constructor(private state: PoliceCaseSnapshot) {}
  static rehydrate(s: PoliceCaseSnapshot): PoliceCase {
    return new PoliceCase({ ...s });
  }
  static draft(input: { id: Id; itemId: Id }): PoliceCase {
    return new PoliceCase({ ...input, createdAt: new Date() });
  }
  get snapshot(): PoliceCaseSnapshot {
    return { ...this.state };
  }
  attachReport(pdfUrl: string): void {
    this.state.pdfUrl = pdfUrl;
  }
  fileWith(caseNumber: string, station: string): void {
    this.state.caseNumber = caseNumber;
    this.state.station = station;
    this.state.filedAt = new Date();
  }
}
