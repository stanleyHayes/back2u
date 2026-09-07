import type { RecoveryCaseDTO, RecoveryCaseDetailDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { toCustodyRecordDTO } from '../../../domain/custody/custody-record.entity.js';
import { RecoveryCase, toRecoveryCaseDTO } from '../../../domain/recovery/recovery-case.entity.js';
import { toRecoveryEventDTO } from '../../../domain/recovery/recovery-event.entity.js';
import { generateCaseReference } from '../../../domain/shared/codes.js';
import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  ICustodyRecordRepository,
  IPartnerStaffRepository,
  IRecoveryCaseRepository,
  IRecoveryEventRepository,
} from '../../ports/custody-repos.js';
import type { IItemRepository } from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { RecordRecoveryEventUseCase } from './record-recovery-event.use-case.js';

/**
 * Opens the case that every found item gets (spec §9: "every found item
 * receives a case ID and immutable-style event history").
 *
 * Idempotent on the found item, so replays and retries reuse the existing case
 * rather than forking the chain of custody.
 */
@injectable()
export class OpenRecoveryCaseUseCase {
  constructor(
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(RecordRecoveryEventUseCase) private readonly recorder: RecordRecoveryEventUseCase,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: {
    foundItemId: Id;
    finderId: Id;
    institutionId?: Id;
    evidence?: Record<string, unknown>;
  }): Promise<RecoveryCase> {
    const existing = await this.cases.findByFoundItemId(input.foundItemId);
    if (existing) return existing;

    const recoveryCase = RecoveryCase.open({
      id: newId(),
      reference: generateCaseReference(),
      foundItemId: input.foundItemId,
      finderId: input.finderId,
      institutionId: input.institutionId,
    });

    // `append` persists the case (claiming the sequence) before inserting the
    // event, so the case does not need a separate save here.
    await this.recorder.append(recoveryCase, {
      kind: 'FOUND_REPORTED',
      actorId: input.finderId,
      evidence: input.evidence ?? {},
    });

    this.logger.info('recovery case opened', {
      caseId: recoveryCase.id,
      reference: recoveryCase.snapshot.reference,
      foundItemId: input.foundItemId,
    });
    return recoveryCase;
  }
}

/**
 * The chain-of-custody view. Visible to the case's own participants, to staff
 * of the holding partner, and to platform admins — nobody else, because the
 * history names both parties and the partner's internal handling.
 */
@injectable()
export class GetRecoveryCaseUseCase {
  constructor(
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.RecoveryEventRepository) private readonly events: IRecoveryEventRepository,
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
  ) {}

  async execute(
    caseId: Id,
    viewer: { userId: Id; isAdmin: boolean },
  ): Promise<RecoveryCaseDetailDTO> {
    const recoveryCase = await this.cases.findById(caseId);
    if (!recoveryCase) throw new NotFoundError('Recovery case');
    const s = recoveryCase.snapshot;

    if (!viewer.isAdmin) {
      const isParticipant = viewer.userId === s.finderId || viewer.userId === s.claimantId;
      const membership = s.institutionId
        ? await this.staff.findMembership(viewer.userId, s.institutionId)
        : null;
      // Staff confined to one counter must not read another counter's custody
      // detail, which includes the internal storage bin.
      const staffMayView = s.locationId
        ? (membership?.canActAt(s.locationId) ?? false)
        : (membership?.active ?? false);
      if (!isParticipant && !staffMayView) {
        throw new ForbiddenError('Not a participant in this recovery');
      }
    }

    const [events, custodyRecord] = await Promise.all([
      this.events.listForCase(caseId),
      s.custodyRecordId ? this.custody.findById(s.custodyRecordId) : Promise.resolve(null),
    ]);

    return {
      ...toRecoveryCaseDTO(recoveryCase),
      events: events.map(toRecoveryEventDTO),
      // The custody record carries the internal storage bin, so it is only
      // attached for viewers who already passed the check above.
      custody: custodyRecord ? toCustodyRecordDTO(custodyRecord) : undefined,
    };
  }
}

/** A person's own recoveries, as finder or claimant. */
@injectable()
export class ListMyRecoveryCasesUseCase {
  constructor(
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
  ) {}

  async execute(userId: Id, limit = 50): Promise<RecoveryCaseDTO[]> {
    const list = await this.cases.listForUser(userId, limit);
    return list.map(toRecoveryCaseDTO);
  }
}

/** The partner console's case queue, scoped to the caller's organisation. */
@injectable()
export class ListInstitutionRecoveryCasesUseCase {
  constructor(
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}

  async execute(
    institutionId: Id,
    opts: { status?: RecoveryCaseDTO['status']; limit: number; skip: number },
  ): Promise<{ cases: (RecoveryCaseDTO & { itemTitle?: string })[]; total: number }> {
    const { cases, total } = await this.cases.listForInstitution(institutionId, opts);
    const items = await this.items.findByIds(cases.map((c) => c.snapshot.foundItemId));
    const titles = new Map(items.map((i) => [i.id, i.snapshot.title]));
    return {
      cases: cases.map((c) => ({
        ...toRecoveryCaseDTO(c),
        itemTitle: titles.get(c.snapshot.foundItemId),
      })),
      total,
    };
  }
}
