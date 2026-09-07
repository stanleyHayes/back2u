import type {
  AddPartnerStaffInput,
  CreatePartnerLocationInput,
  PartnerLocationDTO,
  PartnerStaffDTO,
  PartnerTier,
  PartnerTrustStatus,
  PartnerTrustSummaryDTO,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import {
  PartnerLocation,
  toPartnerLocationDTO,
} from '../../../domain/custody/partner-location.entity.js';
import { PartnerStaff, toPartnerStaffDTO } from '../../../domain/custody/partner-staff.entity.js';
import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  ICustodyRecordRepository,
  IPartnerLocationRepository,
  IPartnerStaffRepository,
} from '../../ports/custody-repos.js';
import type {
  IAuditLogRepository,
  IInstitutionRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class CreatePartnerLocationUseCase {
  constructor(
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(
    institutionId: Id,
    input: CreatePartnerLocationInput,
    actorId: Id,
  ): Promise<PartnerLocationDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');
    if (!institution.canHoldCustody) {
      throw new ForbiddenError(
        `A ${institution.tier} partner cannot run a Recovery Point; change its tier first`,
      );
    }

    const location = PartnerLocation.create({ id: newId(), institutionId, ...input });
    await this.locations.save(location);
    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'partnerLocation.create',
        entity: 'partner_location',
        entityId: location.id,
        meta: { institutionId, name: input.name },
      }),
    );
    return toPartnerLocationDTO(location);
  }
}

@injectable()
export class ListPartnerLocationsUseCase {
  constructor(
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
  ) {}

  async execute(institutionId: Id): Promise<PartnerLocationDTO[]> {
    const list = await this.locations.listForInstitution(institutionId);
    return list.map(toPartnerLocationDTO);
  }
}

@injectable()
export class DeactivatePartnerLocationUseCase {
  constructor(
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(institutionId: Id, locationId: Id, actorId: Id): Promise<PartnerLocationDTO> {
    const location = await this.locations.findById(locationId);
    if (!location) throw new NotFoundError('Recovery Point');
    if (location.institutionId !== institutionId) {
      throw new ForbiddenError('That Recovery Point belongs to another organisation');
    }
    // Closing a counter that still holds property would strand those items with
    // no authorised staff able to release them.
    const { total } = await this.custody.listForLocation(locationId, {
      status: 'held',
      limit: 1,
      skip: 0,
    });
    if (total > 0) {
      throw new ForbiddenError(
        `Cannot close a Recovery Point holding ${total} item(s); transfer or release them first`,
      );
    }
    location.deactivate();
    await this.locations.save(location);
    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'partnerLocation.deactivate',
        entity: 'partner_location',
        entityId: locationId,
        meta: { institutionId },
      }),
    );
    return toPartnerLocationDTO(location);
  }
}

@injectable()
export class AddPartnerStaffUseCase {
  constructor(
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(
    institutionId: Id,
    input: AddPartnerStaffInput,
    actorId: Id,
  ): Promise<PartnerStaffDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');

    if (input.locationId) {
      const location = await this.locations.findById(input.locationId);
      if (!location || location.institutionId !== institutionId) {
        throw new NotFoundError('Recovery Point');
      }
    }

    // A unique (userId, institutionId) index means re-adding someone who was
    // previously removed must reuse their membership row, not mint a new one —
    // otherwise a departed-and-returning staff member is permanently locked out.
    const existing = await this.staff.findMembership(input.userId, institutionId);
    const membership = existing ?? PartnerStaff.add({ id: newId(), institutionId, ...input });
    if (existing) existing.reactivate(input.role, input.locationId);
    await this.staff.save(membership);
    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'partnerStaff.add',
        entity: 'partner_staff',
        entityId: membership.id,
        meta: { institutionId, userId: input.userId, role: input.role },
      }),
    );
    return toPartnerStaffDTO(membership, {
      name: user.snapshot.name,
      email: user.snapshot.email,
    });
  }
}

@injectable()
export class ListPartnerStaffUseCase {
  constructor(
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
  ) {}

  async execute(institutionId: Id): Promise<PartnerStaffDTO[]> {
    const memberships = await this.staff.listForInstitution(institutionId);
    return Promise.all(
      memberships.map(async (m) => {
        const user = await this.users.findById(m.userId);
        return toPartnerStaffDTO(
          m,
          user ? { name: user.snapshot.name, email: user.snapshot.email } : undefined,
        );
      }),
    );
  }
}

@injectable()
export class RemovePartnerStaffUseCase {
  constructor(
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(institutionId: Id, staffId: Id, actorId: Id): Promise<PartnerStaffDTO> {
    const membership = await this.staff.findById(staffId);
    if (!membership) throw new NotFoundError('Staff member');
    if (membership.institutionId !== institutionId) {
      throw new ForbiddenError('That staff member belongs to another organisation');
    }
    membership.deactivate();
    await this.staff.save(membership);
    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'partnerStaff.remove',
        entity: 'partner_staff',
        entityId: staffId,
        meta: { institutionId, userId: membership.userId },
      }),
    );
    return toPartnerStaffDTO(membership);
  }
}

/** Partner health for the console and the Trust & Safety queue (spec §12). */
@injectable()
export class GetPartnerTrustSummaryUseCase {
  constructor(
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
  ) {}

  async execute(institutionId: Id): Promise<PartnerTrustSummaryDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');

    const [counts, staffCount, locationCount] = await Promise.all([
      this.custody.countForInstitution(institutionId),
      this.staff.countForInstitution(institutionId),
      this.locations.countForInstitution(institutionId),
    ]);

    return {
      institutionId,
      tier: institution.tier,
      trustStatus: institution.trustStatus,
      deposits: counts.deposits,
      releases: counts.releases,
      depositsToReturnsRatio:
        counts.deposits > 0 ? Number((counts.releases / counts.deposits).toFixed(3)) : null,
      openCustody: counts.open,
      staffCount,
      locationCount,
    };
  }
}

export interface PartnerStandingDTO {
  institutionId: Id;
  tier: PartnerTier;
  trustStatus: PartnerTrustStatus;
}

/** Admin control over a partner's tier and standing (spec §11, §12). */
@injectable()
export class SetPartnerStandingUseCase {
  constructor(
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(
    institutionId: Id,
    input: { tier?: PartnerTier; trustStatus?: PartnerTrustStatus; note?: string },
    actorId: Id,
  ): Promise<PartnerStandingDTO> {
    const institution = await this.institutions.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution');

    const before = { tier: institution.tier, trustStatus: institution.trustStatus };
    if (input.tier) institution.setTier(input.tier);
    if (input.trustStatus) {
      // An admin is explicitly allowed to lift a partner back out of a hold.
      institution.setTrustStatus(input.trustStatus, { note: input.note, byAdmin: true });
    }
    await this.institutions.save(institution);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'partner.setStanding',
        entity: 'institution',
        entityId: institutionId,
        meta: {
          before,
          after: { tier: institution.tier, trustStatus: institution.trustStatus },
          note: input.note,
        },
      }),
    );

    return {
      institutionId,
      tier: institution.tier,
      trustStatus: institution.trustStatus,
    };
  }
}
