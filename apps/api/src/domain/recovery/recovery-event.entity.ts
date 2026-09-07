import type { RecoveryEventDTO, RecoveryEventKind } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface RecoveryEventSnapshot {
  id: Id;
  caseId: Id;
  sequence: number;
  kind: RecoveryEventKind;
  actorId?: Id;
  actorStaffId?: Id;
  institutionId?: Id;
  locationId?: Id;
  evidence: Record<string, unknown>;
  note?: string;
  correctsEventId?: Id;
  occurredAt: Date;
}

/**
 * One immutable link in an item's chain of custody (spec §9).
 *
 * There are deliberately no mutators. Spec §12 requires that partner staff
 * cannot silently alter custody history, and §9 that "corrections create new
 * events rather than silently rewriting critical custody history" — so a
 * mistake is superseded by a {@link RecoveryEvent.correction}, never edited.
 * The repository writes these with an insert, never an upsert.
 */
export class RecoveryEvent {
  private constructor(private readonly state: RecoveryEventSnapshot) {}

  static rehydrate(s: RecoveryEventSnapshot): RecoveryEvent {
    return new RecoveryEvent({ ...s });
  }

  static record(input: {
    id: Id;
    caseId: Id;
    sequence: number;
    kind: RecoveryEventKind;
    actorId?: Id;
    actorStaffId?: Id;
    institutionId?: Id;
    locationId?: Id;
    evidence?: Record<string, unknown>;
    note?: string;
    occurredAt?: Date;
  }): RecoveryEvent {
    return new RecoveryEvent({
      ...input,
      evidence: input.evidence ?? {},
      occurredAt: input.occurredAt ?? new Date(),
    });
  }

  /** Supersedes an earlier event without removing it from the history. */
  static correction(input: {
    id: Id;
    caseId: Id;
    sequence: number;
    correctsEventId: Id;
    actorId: Id;
    note: string;
    evidence?: Record<string, unknown>;
  }): RecoveryEvent {
    return new RecoveryEvent({
      ...input,
      kind: 'CORRECTION',
      evidence: input.evidence ?? {},
      occurredAt: new Date(),
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get sequence(): number {
    return this.state.sequence;
  }
  get kind(): RecoveryEventKind {
    return this.state.kind;
  }
  get snapshot(): RecoveryEventSnapshot {
    return { ...this.state, evidence: { ...this.state.evidence } };
  }
}

export function toRecoveryEventDTO(e: RecoveryEvent): RecoveryEventDTO {
  const s = e.snapshot;
  return {
    id: s.id,
    caseId: s.caseId,
    sequence: s.sequence,
    kind: s.kind,
    actorId: s.actorId,
    actorStaffId: s.actorStaffId,
    institutionId: s.institutionId,
    locationId: s.locationId,
    evidence: s.evidence,
    note: s.note,
    correctsEventId: s.correctsEventId,
    occurredAt: s.occurredAt.toISOString(),
  };
}
