import type {
  AcceptCustodyInput,
  CustodyReceiptDTO,
  CustodyRecordDTO,
  ReleaseCustodyInput,
  VerificationLevel,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import {
  CustodyRecord,
  toCustodyRecordDTO,
} from '../../../domain/custody/custody-record.entity.js';
import type { PartnerStaff } from '../../../domain/custody/partner-staff.entity.js';
import type { Institution } from '../../../domain/institution/institution.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import type { RecoveryCase } from '../../../domain/recovery/recovery-case.entity.js';
import { generateCode } from '../../../domain/shared/codes.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { generate6DigitCode } from '../../../domain/auth/otp.entity.js';
import type {
  ICustodyRecordRepository,
  IPartnerLocationRepository,
  IPartnerStaffRepository,
  IRecoveryCaseRepository,
} from '../../ports/custody-repos.js';
import type {
  IAuditLogRepository,
  IInstitutionRepository,
  IItemRepository,
  INotificationRepository,
  IUserRepository,
  IVerificationRepository,
} from '../../ports/repositories.js';
import type { ILogger, IRealtimeBus, ISmsService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { AwardPointsUseCase } from '../points/award-points.use-case.js';
import { RecordRecoveryEventUseCase } from './record-recovery-event.use-case.js';
import { OpenRecoveryCaseUseCase } from './recovery-case.use-cases.js';

/**
 * Resolves and authorises the staff member behind a custody action.
 *
 * Every custody operation needs the same four checks — the partner exists, its
 * tier permits custody, it is not suspended, and the caller is active staff for
 * that location — so they live in one place rather than being re-derived (and
 * eventually diverging) at each call site.
 */
@injectable()
export class ResolveCustodyActorUseCase {
  constructor(
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.InstitutionRepository) private readonly institutions: IInstitutionRepository,
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
  ) {}

  async execute(input: {
    userId: Id;
    institutionId: Id;
    locationId: Id;
  }): Promise<{ staff: PartnerStaff; institution: Institution }> {
    const institution = await this.institutions.findById(input.institutionId);
    if (!institution) throw new NotFoundError('Institution');
    if (!institution.canHoldCustody) {
      throw new ForbiddenError(
        `A ${institution.tier} partner is not permitted to take custody of property`,
      );
    }
    if (!institution.canOperateCustody) {
      throw new ForbiddenError('This partner is suspended and cannot handle property');
    }

    const location = await this.locations.findById(input.locationId);
    if (!location) throw new NotFoundError('Recovery Point');
    if (location.institutionId !== input.institutionId) {
      throw new ForbiddenError('That Recovery Point belongs to another organisation');
    }
    if (!location.active) throw new ConflictError('That Recovery Point is closed');

    const membership = await this.staff.findMembership(input.userId, input.institutionId);
    if (!membership?.active) throw new ForbiddenError('You are not staff at this organisation');
    if (!membership.canActAt(input.locationId)) {
      throw new ForbiddenError('You are not assigned to that Recovery Point');
    }

    return { staff: membership, institution };
  }
}

/**
 * Takes an item into partner custody (spec §10).
 *
 * This is what makes a recovery level B rather than level A: an independent
 * party has seen the item, recorded its condition, sealed it and issued the
 * finder a receipt. The deposit itself earns points immediately — the finder
 * has done the trustworthy thing whether or not the owner is ever found.
 */
@injectable()
export class AcceptCustodyUseCase {
  constructor(
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(ResolveCustodyActorUseCase) private readonly resolveActor: ResolveCustodyActorUseCase,
    @inject(OpenRecoveryCaseUseCase) private readonly openCase: OpenRecoveryCaseUseCase,
    @inject(RecordRecoveryEventUseCase) private readonly recorder: RecordRecoveryEventUseCase,
    @inject(AwardPointsUseCase) private readonly award: AwardPointsUseCase,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: {
    actorUserId: Id;
    institutionId: Id;
    body: AcceptCustodyInput;
  }): Promise<CustodyReceiptDTO> {
    const { body } = input;
    const { staff, institution } = await this.resolveActor.execute({
      userId: input.actorUserId,
      institutionId: input.institutionId,
      locationId: body.locationId,
    });

    const item = await this.items.findById(body.itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.kind !== 'found') {
      throw new ValidationError('Only a found item can be taken into custody');
    }
    const alreadyHeld = await this.custody.findActiveForItem(body.itemId);
    if (alreadyHeld) throw new ConflictError('That item is already in custody');

    // Validate the depositor before anything is written. Discovering an unknown
    // user after the item is booked in would abort the request with the record
    // already durable — the counter would have no receipt and no way to retry.
    const depositor = await this.users.findById(body.depositedByUserId);
    if (!depositor) throw new NotFoundError('Depositing user');

    const recoveryCase = await this.openCase.execute({
      foundItemId: item.id,
      finderId: body.depositedByUserId,
      institutionId: input.institutionId,
    });

    const record = CustodyRecord.accept({
      id: newId(),
      caseId: recoveryCase.id,
      itemId: item.id,
      institutionId: input.institutionId,
      locationId: body.locationId,
      depositedByUserId: body.depositedByUserId,
      acceptedByStaffId: staff.userId,
      condition: body.condition,
      declaredContents: body.declaredContents,
      sealId: `SEAL-${generateCode(10)}`,
      storageBin: body.storageBin,
      intakePhotos: body.intakePhotos,
      receiptCode: generateCode(8),
    });
    // A verified Recovery Point is the strongest custody evidence short of an
    // institution's own lost-property office (spec §5 levels B and D).
    const level: VerificationLevel =
      institution.tier === 'institutional' || institution.tier === 'government'
        ? 'institutional'
        : 'recovery_point';

    // Advance the case first. `acceptCustody` throws if the case is not in a
    // state that admits a deposit, and validating that after saving the custody
    // record would leave an orphaned `held` row blocking the item forever.
    recoveryCase.acceptCustody({
      custodyRecordId: record.id,
      institutionId: input.institutionId,
      locationId: body.locationId,
      verificationLevel: level,
    });
    await this.custody.save(record);

    await this.recorder.append(recoveryCase, {
      kind: 'CUSTODY_ACCEPTED',
      actorId: staff.userId,
      actorStaffId: staff.id,
      institutionId: input.institutionId,
      locationId: body.locationId,
      evidence: {
        custodyRecordId: record.id,
        condition: body.condition,
        declaredContents: record.snapshot.declaredContents,
        sealId: record.snapshot.sealId,
        intakePhotos: record.snapshot.intakePhotos,
        depositedByUserId: body.depositedByUserId,
      },
    });

    // The deposit is its own verified action (§3) — credited to the finder, not
    // the staff member, and idempotent on the custody record.
    // Keyed on the CASE, not the custody record: `ReverseCasePointsUseCase` and
    // the clearing job's risk hold both look up work by caseRef, so a deposit
    // filed under its own id would survive a confirmed-fraud reversal.
    await this.award.execute({
      userId: body.depositedByUserId,
      action: 'recovery_point_deposit',
      verificationLevel: level,
      caseRef: recoveryCase.id,
      itemId: item.id,
    });

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: staff.userId,
        action: 'custody.accept',
        entity: 'custody_record',
        entityId: record.id,
        meta: {
          caseId: recoveryCase.id,
          itemId: item.id,
          institutionId: input.institutionId,
          locationId: body.locationId,
        },
      }),
    );

    const receipt: CustodyReceiptDTO = {
      caseId: recoveryCase.id,
      custodyRecordId: record.id,
      itemId: item.id,
      receiptCode: record.snapshot.receiptCode,
      sealId: record.snapshot.sealId,
      locationName: institution.snapshot.name,
      acceptedAt: record.snapshot.createdAt.toISOString(),
    };

    const title = 'Item received at a Recovery Point';
    const body_ = `"${item.snapshot.title}" is now held securely. Your receipt code is ${receipt.receiptCode}.`;
    await this.notifications.save(
      Notification.create({
        id: newId(),
        userId: body.depositedByUserId,
        type: 'system',
        title,
        body: body_,
        data: { caseId: recoveryCase.id, receiptCode: receipt.receiptCode },
      }),
    );
    this.bus.publishToUser(body.depositedByUserId, 'custody:accepted', {
      caseId: recoveryCase.id,
      itemId: item.id,
    });

    this.logger.info('custody accepted', {
      custodyRecordId: record.id,
      caseId: recoveryCase.id,
      institutionId: input.institutionId,
    });
    return receipt;
  }
}

/**
 * Issues the one-time code that authorises a handover.
 *
 * Sent to the claimant, not the counter: the point of the code is to prove that
 * the person standing at the desk is the account the platform verified, so
 * staff must not be able to mint and read it themselves.
 */
@injectable()
export class IssueReleaseCodeUseCase {
  constructor(
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.VerificationRepository) private readonly verifications: IVerificationRepository,
    @inject(ResolveCustodyActorUseCase) private readonly resolveActor: ResolveCustodyActorUseCase,
    @inject(TOKENS.SmsService) private readonly sms: ISmsService,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: {
    actorUserId: Id;
    institutionId: Id;
    custodyRecordId: Id;
    claimantId: Id;
  }): Promise<{ issued: true; sentTo: 'sms' | 'notification' }> {
    const record = await this.custody.findById(input.custodyRecordId);
    if (!record) throw new NotFoundError('Custody record');
    await this.resolveActor.execute({
      userId: input.actorUserId,
      institutionId: input.institutionId,
      locationId: record.snapshot.locationId,
    });
    if (record.snapshot.institutionId !== input.institutionId) {
      throw new ForbiddenError('That item is held by another organisation');
    }

    // §8 and §24: a match is not proof of ownership. Nothing leaves the shelf
    // until an ownership verification for this exact claimant was approved.
    const proven = await this.verifications.listForItem(record.snapshot.itemId);
    const approved = proven.some(
      (v) => v.snapshot.claimantId === input.claimantId && v.snapshot.status === 'approved',
    );
    if (!approved) {
      throw new ForbiddenError('Ownership has not been verified for this claimant');
    }

    const claimant = await this.users.findById(input.claimantId);
    if (!claimant) throw new NotFoundError('Claimant');

    const code = generate6DigitCode();
    record.issueReleaseCode(code, input.claimantId);
    await this.custody.save(record);

    const recoveryCase = await this.cases.findById(record.snapshot.caseId);
    const message = `Your Bak2Me collection code is ${code}. Show it at the counter to collect your item. It expires in 30 minutes.`;

    let sentTo: 'sms' | 'notification' = 'notification';
    const phone = claimant.snapshot.phone;
    if (phone && claimant.snapshot.phoneVerified) {
      try {
        await this.sms.send(phone, message);
        sentTo = 'sms';
      } catch (err) {
        this.logger.warn('release code SMS failed; falling back to in-app', {
          custodyRecordId: record.id,
          err: String(err),
        });
      }
    }

    await this.notifications.save(
      Notification.create({
        id: newId(),
        userId: input.claimantId,
        type: 'system',
        title: 'Your collection code',
        body: message,
        data: { caseId: recoveryCase?.id, custodyRecordId: record.id },
      }),
    );

    this.logger.info('release code issued', {
      custodyRecordId: record.id,
      claimantId: input.claimantId,
      sentTo,
    });
    return { issued: true, sentTo };
  }
}

/**
 * Hands the item over (spec §10 release controls).
 *
 * Everything that makes a release safe converges here: an authorised staff
 * member, a verified claimant, a live one-time code, and separation of duties
 * enforced inside the entity.
 */
@injectable()
export class ReleaseCustodyUseCase {
  constructor(
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.VerificationRepository) private readonly verifications: IVerificationRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(ResolveCustodyActorUseCase) private readonly resolveActor: ResolveCustodyActorUseCase,
    @inject(RecordRecoveryEventUseCase) private readonly recorder: RecordRecoveryEventUseCase,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: {
    actorUserId: Id;
    institutionId: Id;
    custodyRecordId: Id;
    body: ReleaseCustodyInput;
  }): Promise<CustodyRecordDTO> {
    const record = await this.custody.findById(input.custodyRecordId);
    if (!record) throw new NotFoundError('Custody record');
    if (record.snapshot.institutionId !== input.institutionId) {
      throw new ForbiddenError('That item is held by another organisation');
    }
    const { staff } = await this.resolveActor.execute({
      userId: input.actorUserId,
      institutionId: input.institutionId,
      locationId: record.snapshot.locationId,
    });

    const approvals = await this.verifications.listForItem(record.snapshot.itemId);
    const approval = approvals.find(
      (v) => v.snapshot.claimantId === input.body.claimantId && v.snapshot.status === 'approved',
    );
    if (!approval) throw new ForbiddenError('Ownership has not been verified for this claimant');

    // Throws on a bad, stale or exhausted code, on a code issued to someone
    // else, and on a staff member trying to release to themselves. The attempt
    // counter is persisted either way, so a failed guess is not free.
    try {
      record.release({
        code: input.body.releaseCode,
        claimantId: input.body.claimantId,
        releasedByStaffId: staff.userId,
        note: input.body.note,
      });
    } catch (err) {
      await this.custody.save(record);
      throw err;
    }

    // Move the case and write the chain BEFORE committing the handover. A case
    // that refuses the transition must not leave a released item with no
    // ITEM_RELEASED link — the chain of custody is the point of the feature.
    const recoveryCase = await this.cases.findById(record.snapshot.caseId);
    if (recoveryCase) {
      // A release only makes sense once ownership is settled; move the case
      // through that rung first if the claim was verified out of band.
      if (recoveryCase.status !== 'ownership_verified') {
        recoveryCase.verifyOwnership(input.body.claimantId);
        await this.recorder.append(recoveryCase, {
          kind: 'OWNERSHIP_VERIFIED',
          actorId: staff.userId,
          actorStaffId: staff.id,
          evidence: {
            verificationId: approval.snapshot.id,
            method: 'partner_desk',
            claimantId: input.body.claimantId,
          },
        });
      }
      recoveryCase.release();
      await this.recorder.append(recoveryCase, {
        kind: 'ITEM_RELEASED',
        actorId: staff.userId,
        actorStaffId: staff.id,
        institutionId: input.institutionId,
        locationId: record.snapshot.locationId,
        evidence: {
          custodyRecordId: record.id,
          recipientId: input.body.claimantId,
          acknowledgement: 'otp',
          sealId: record.snapshot.sealId,
        },
        note: input.body.note,
      });
    }

    await this.custody.save(record);

    const item = await this.items.findById(record.snapshot.itemId);
    if (item && item.snapshot.status !== 'returned') {
      item.markClaimed();
      await this.items.save(item);
    }

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: staff.userId,
        action: 'custody.release',
        entity: 'custody_record',
        entityId: record.id,
        meta: {
          claimantId: input.body.claimantId,
          institutionId: input.institutionId,
          caseId: record.snapshot.caseId,
        },
      }),
    );

    await this.notifications.save(
      Notification.create({
        id: newId(),
        userId: input.body.claimantId,
        type: 'system',
        title: 'Item collected',
        body: 'Your item has been released to you. Please confirm the return in the app.',
        data: { custodyRecordId: record.id, caseId: record.snapshot.caseId },
      }),
    );
    this.bus.publishToUser(input.body.claimantId, 'custody:released', {
      custodyRecordId: record.id,
      caseId: record.snapshot.caseId,
    });

    this.logger.info('custody released', {
      custodyRecordId: record.id,
      claimantId: input.body.claimantId,
      staffId: staff.id,
    });
    return toCustodyRecordDTO(record);
  }
}

/** The shelf list for one Recovery Point. */
@injectable()
export class ListCustodyAtLocationUseCase {
  constructor(
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.PartnerLocationRepository)
    private readonly locations: IPartnerLocationRepository,
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}

  async execute(input: {
    actorUserId: Id;
    institutionId: Id;
    locationId: Id;
    status?: CustodyRecordDTO['status'];
    limit: number;
    skip: number;
  }): Promise<{ records: (CustodyRecordDTO & { itemTitle?: string })[]; total: number }> {
    const location = await this.locations.findById(input.locationId);
    if (!location) throw new NotFoundError('Recovery Point');
    if (location.institutionId !== input.institutionId) {
      throw new ForbiddenError('That Recovery Point belongs to another organisation');
    }
    const membership = await this.staff.findMembership(input.actorUserId, input.institutionId);
    if (!membership?.canActAt(input.locationId)) {
      throw new ForbiddenError('You are not assigned to that Recovery Point');
    }

    const { records, total } = await this.custody.listForLocation(input.locationId, {
      status: input.status,
      limit: input.limit,
      skip: input.skip,
    });
    const items = await this.items.findByIds(records.map((r) => r.snapshot.itemId));
    const titles = new Map(items.map((i) => [i.id, i.snapshot.title]));
    return {
      records: records.map((r) => ({
        ...toCustodyRecordDTO(r),
        itemTitle: titles.get(r.snapshot.itemId),
      })),
      total,
    };
  }
}
