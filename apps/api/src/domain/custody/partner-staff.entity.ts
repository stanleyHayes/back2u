import type { PartnerStaffDTO, PartnerStaffRole } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface PartnerStaffSnapshot {
  id: Id;
  userId: Id;
  institutionId: Id;
  /** Undefined means the member may act at any of the org's locations. */
  locationId?: Id;
  role: PartnerStaffRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Actions only a supervisor or manager may take. */
const ELEVATED: PartnerStaffRole[] = ['supervisor', 'manager'];

/**
 * A membership linking an existing platform `User` to a partner organisation
 * (spec §10 staff roles, §12 staff audit identity).
 *
 * Deliberately a membership row rather than a new `UserRole` or a separate
 * credential: staff sign in through the normal auth path, keeping MFA, refresh
 * rotation and account recovery in one place, and a person can hold different
 * roles at different locations.
 */
export class PartnerStaff {
  private constructor(private state: PartnerStaffSnapshot) {}

  static rehydrate(s: PartnerStaffSnapshot): PartnerStaff {
    return new PartnerStaff({ ...s });
  }

  static add(input: {
    id: Id;
    userId: Id;
    institutionId: Id;
    locationId?: Id;
    role: PartnerStaffRole;
  }): PartnerStaff {
    const now = new Date();
    return new PartnerStaff({ ...input, active: true, createdAt: now, updatedAt: now });
  }

  get id(): Id {
    return this.state.id;
  }
  get userId(): Id {
    return this.state.userId;
  }
  get institutionId(): Id {
    return this.state.institutionId;
  }
  get active(): boolean {
    return this.state.active;
  }
  get snapshot(): PartnerStaffSnapshot {
    return { ...this.state };
  }

  /** True if this membership may act at the given location. */
  canActAt(locationId: Id): boolean {
    return (
      this.state.active &&
      (this.state.locationId === undefined || this.state.locationId === locationId)
    );
  }

  /** True if this membership may approve sensitive actions (maker-checker). */
  get canApprove(): boolean {
    return this.state.active && ELEVATED.includes(this.state.role);
  }

  changeRole(role: PartnerStaffRole): void {
    this.state.role = role;
    this.state.updatedAt = new Date();
  }

  assignLocation(locationId?: Id): void {
    this.state.locationId = locationId;
    this.state.updatedAt = new Date();
  }

  deactivate(): void {
    this.state.active = false;
    this.state.updatedAt = new Date();
  }

  /** Brings a previously removed member back, optionally in a new role. */
  reactivate(role?: PartnerStaffRole, locationId?: Id): void {
    this.state.active = true;
    if (role) this.state.role = role;
    this.state.locationId = locationId;
    this.state.updatedAt = new Date();
  }
}

export function toPartnerStaffDTO(
  s: PartnerStaff,
  user?: { name: string; email: string },
): PartnerStaffDTO {
  const v = s.snapshot;
  return {
    id: v.id,
    userId: v.userId,
    institutionId: v.institutionId,
    locationId: v.locationId,
    role: v.role,
    active: v.active,
    createdAt: v.createdAt.toISOString(),
    userName: user?.name,
    userEmail: user?.email,
  };
}
