import type { InstitutionLeadStatus } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface InstitutionLeadSnapshot {
  id: Id;
  name: string;
  type?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city: string;
  lat?: number;
  lng?: number;
  estimatedVolume?: string;
  message?: string;
  status: InstitutionLeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type InstitutionLeadDecision = 'contacted' | 'approved' | 'rejected';

export class InstitutionLead {
  private constructor(private state: InstitutionLeadSnapshot) {}

  static rehydrate(s: InstitutionLeadSnapshot): InstitutionLead {
    return new InstitutionLead({ ...s });
  }

  static submit(
    input: Omit<InstitutionLeadSnapshot, 'status' | 'createdAt' | 'updatedAt'>,
  ): InstitutionLead {
    const now = new Date();
    return new InstitutionLead({ ...input, status: 'new', createdAt: now, updatedAt: now });
  }

  get id(): Id {
    return this.state.id;
  }

  get snapshot(): InstitutionLeadSnapshot {
    return { ...this.state };
  }

  decide(decision: InstitutionLeadDecision): void {
    this.state.status = decision;
    this.state.updatedAt = new Date();
  }
}
