import type { RecoveryEventKind } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { RecoveryCase } from '../../../domain/recovery/recovery-case.entity.js';
import { RecoveryEvent } from '../../../domain/recovery/recovery-event.entity.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IRecoveryCaseRepository,
  IRecoveryEventRepository,
} from '../../ports/custody-repos.js';
import { TOKENS } from '../../ports/tokens.js';

export interface RecordRecoveryEventCommand {
  caseId: Id;
  kind: RecoveryEventKind;
  actorId?: Id;
  actorStaffId?: Id;
  institutionId?: Id;
  locationId?: Id;
  evidence?: Record<string, unknown>;
  note?: string;
}

/**
 * The single writer of the chain of custody (spec §9).
 *
 * Sequence numbers are claimed from the case, so the chain stays gap-free and
 * ordered even when several actors touch a case. A unique (caseId, sequence)
 * index turns a genuine race into a conflict rather than a silently reordered
 * history.
 */
@injectable()
export class RecordRecoveryEventUseCase {
  constructor(
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.RecoveryEventRepository) private readonly events: IRecoveryEventRepository,
  ) {}

  async execute(cmd: RecordRecoveryEventCommand): Promise<RecoveryEvent> {
    const recoveryCase = await this.cases.findById(cmd.caseId);
    if (!recoveryCase) throw new NotFoundError('Recovery case');
    return this.append(recoveryCase, cmd);
  }

  /**
   * Appends against an already-loaded case, persisting the case first.
   *
   * The order matters: the sequence counter lives on the case, so if the event
   * were inserted before the counter was durable, a crash in between would let
   * the next event claim the same number and collide forever on the unique
   * (caseId, sequence) index — the chain would be permanently wedged. Saving
   * first can at worst burn a number and leave a gap, which is recoverable.
   *
   * Saving the case here also persists whatever status transition the caller
   * made, so a caller should mutate the case and then append, without a second
   * save of its own.
   */
  async append(
    recoveryCase: RecoveryCase,
    cmd: Omit<RecordRecoveryEventCommand, 'caseId'>,
  ): Promise<RecoveryEvent> {
    const sequence = recoveryCase.nextSequence();
    await this.cases.save(recoveryCase);

    const s = recoveryCase.snapshot;
    const event = RecoveryEvent.record({
      id: newId(),
      caseId: s.id,
      sequence,
      kind: cmd.kind,
      actorId: cmd.actorId,
      actorStaffId: cmd.actorStaffId,
      institutionId: cmd.institutionId ?? s.institutionId,
      locationId: cmd.locationId ?? s.locationId,
      evidence: cmd.evidence,
      note: cmd.note,
    });
    await this.events.append(event);
    return event;
  }
}
