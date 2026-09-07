import type { PartnerLocationDTO, PlaceRef } from '@back2u/shared-types';

import { ValidationError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface PartnerLocationSnapshot {
  id: Id;
  institutionId: Id;
  name: string;
  place: PlaceRef;
  storageDescription?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One physical Recovery Point counter (spec §10). An organisation can run many;
 * `Institution.place` remains the single directory address shown publicly.
 */
export class PartnerLocation {
  private constructor(private state: PartnerLocationSnapshot) {}

  static rehydrate(s: PartnerLocationSnapshot): PartnerLocation {
    return new PartnerLocation({ ...s });
  }

  static create(input: {
    id: Id;
    institutionId: Id;
    name: string;
    place: PlaceRef;
    storageDescription?: string;
  }): PartnerLocation {
    const name = input.name.trim();
    if (name.length === 0) throw new ValidationError('Location name cannot be empty');
    const now = new Date();
    return new PartnerLocation({
      ...input,
      name,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get institutionId(): Id {
    return this.state.institutionId;
  }
  get active(): boolean {
    return this.state.active;
  }
  get snapshot(): PartnerLocationSnapshot {
    return { ...this.state };
  }

  update(input: { name?: string; place?: PlaceRef; storageDescription?: string }): void {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length === 0) throw new ValidationError('Location name cannot be empty');
      this.state.name = name;
    }
    if (input.place !== undefined) this.state.place = input.place;
    if (input.storageDescription !== undefined) {
      this.state.storageDescription = input.storageDescription || undefined;
    }
    this.state.updatedAt = new Date();
  }

  deactivate(): void {
    this.state.active = false;
    this.state.updatedAt = new Date();
  }

  reactivate(): void {
    this.state.active = true;
    this.state.updatedAt = new Date();
  }
}

export function toPartnerLocationDTO(l: PartnerLocation): PartnerLocationDTO {
  const s = l.snapshot;
  return {
    id: s.id,
    institutionId: s.institutionId,
    name: s.name,
    place: s.place,
    storageDescription: s.storageDescription,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
  };
}
