import type {
  CreateRewardOfferInput,
  RewardCategory,
  RewardOfferDTO,
  RewardOfferStatus,
  TrustLevel,
  UpdateRewardOfferInput,
} from '@back2u/shared-types';
import { TRUST_LEVELS } from '@back2u/shared-types';

import { ConflictError, ValidationError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

/** How long a reservation is held for collection when the partner sets nothing. */
export const DEFAULT_RESERVATION_HOURS = 72;

export interface RewardOfferSnapshot {
  id: Id;
  institutionId: Id;
  title: string;
  description: string;
  category: RewardCategory;
  imageUrl?: string;
  pointsCost: number;
  status: RewardOfferStatus;
  /** `undefined` means unlimited. */
  totalInventory?: number;
  remainingInventory?: number;
  startsAt?: Date;
  endsAt?: Date;
  perUserLimit?: number;
  minTrustLevel?: TrustLevel;
  reservationHours: number;
  termsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Why a member cannot reserve an offer, in words they can act on. */
export type IneligibleReason =
  | 'not_live'
  | 'not_started'
  | 'ended'
  | 'sold_out'
  | 'per_user_limit'
  | 'trust_level'
  | 'insufficient_points';

export const INELIGIBLE_MESSAGES: Record<IneligibleReason, string> = {
  not_live: 'This reward is not currently available.',
  not_started: 'This reward has not opened yet.',
  ended: 'This campaign has ended.',
  sold_out: 'This reward is fully claimed.',
  per_user_limit: 'You have already claimed this reward the maximum number of times.',
  trust_level: 'This reward is reserved for members at a higher community level.',
  insufficient_points: 'You do not have enough BakPoints for this reward.',
};

/**
 * A partner-funded benefit in the rewards catalogue (spec §13).
 *
 * The platform never funds these — the point of the partner-funded model is to
 * reward finders without Bak2Me paying for it, and without opening a
 * BakPoints-to-cash channel that would put a price on manufacturing a recovery.
 */
export class RewardOffer {
  private constructor(private state: RewardOfferSnapshot) {}

  static rehydrate(s: RewardOfferSnapshot): RewardOffer {
    return new RewardOffer({ ...s });
  }

  static create(input: { id: Id; institutionId: Id } & CreateRewardOfferInput): RewardOffer {
    const title = input.title.trim();
    if (title.length === 0) throw new ValidationError('Title cannot be empty');
    if (!Number.isInteger(input.pointsCost) || input.pointsCost <= 0) {
      throw new ValidationError('A reward must cost a positive whole number of BakPoints');
    }
    const inventory = normaliseInventory(input.totalInventory);
    const window = normaliseWindow(input.startsAt, input.endsAt);
    const now = new Date();

    return new RewardOffer({
      id: input.id,
      institutionId: input.institutionId,
      title,
      description: input.description.trim(),
      category: input.category,
      imageUrl: input.imageUrl,
      pointsCost: input.pointsCost,
      // Created as a draft: a partner should be able to set inventory and dates
      // before members can see it.
      status: 'draft',
      totalInventory: inventory,
      remainingInventory: inventory,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      perUserLimit: normalisePerUserLimit(input.perUserLimit),
      minTrustLevel: input.minTrustLevel,
      reservationHours: normaliseReservationHours(input.reservationHours),
      termsUrl: input.termsUrl,
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
  get pointsCost(): number {
    return this.state.pointsCost;
  }
  get snapshot(): RewardOfferSnapshot {
    return { ...this.state };
  }
  get isUnlimited(): boolean {
    return this.state.totalInventory === undefined;
  }

  /** When a reservation made now would lapse. */
  reservationExpiry(now = new Date()): Date {
    return new Date(now.getTime() + this.state.reservationHours * 3_600_000);
  }

  /**
   * Whether the offer itself is open — independent of any particular member.
   * Per-user limits, trust level and balance are checked by the caller, which
   * is the only place that knows about the member.
   */
  availability(now = new Date()): IneligibleReason | null {
    if (this.state.status !== 'live') return 'not_live';
    if (this.state.startsAt && now < this.state.startsAt) return 'not_started';
    if (this.state.endsAt && now > this.state.endsAt) return 'ended';
    if (!this.isUnlimited && (this.state.remainingInventory ?? 0) <= 0) return 'sold_out';
    return null;
  }

  /** True when the member's standing clears the offer's eligibility bar. */
  allowsTrustLevel(level: TrustLevel): boolean {
    if (!this.state.minTrustLevel) return true;
    return TRUST_LEVELS.indexOf(level) >= TRUST_LEVELS.indexOf(this.state.minTrustLevel);
  }

  update(input: UpdateRewardOfferInput): void {
    const next = { ...this.state };

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (title.length === 0) throw new ValidationError('Title cannot be empty');
      next.title = title;
    }
    if (input.description !== undefined) next.description = input.description.trim();
    if (input.category !== undefined) next.category = input.category;
    if (input.imageUrl !== undefined) next.imageUrl = input.imageUrl || undefined;
    if (input.termsUrl !== undefined) next.termsUrl = input.termsUrl || undefined;
    if (input.minTrustLevel !== undefined) next.minTrustLevel = input.minTrustLevel;
    if (input.perUserLimit !== undefined)
      next.perUserLimit = normalisePerUserLimit(input.perUserLimit);
    if (input.reservationHours !== undefined) {
      next.reservationHours = normaliseReservationHours(input.reservationHours);
    }
    if (input.pointsCost !== undefined) {
      if (!Number.isInteger(input.pointsCost) || input.pointsCost <= 0) {
        throw new ValidationError('A reward must cost a positive whole number of BakPoints');
      }
      next.pointsCost = input.pointsCost;
    }

    if (input.totalInventory !== undefined) {
      const total = normaliseInventory(input.totalInventory);
      if (total === undefined) {
        next.totalInventory = undefined;
        next.remainingInventory = undefined;
      } else {
        // Adjust what is left by the same delta, so raising a cap releases
        // exactly the stock added rather than resetting claims already made.
        const claimed = (this.state.totalInventory ?? 0) - (this.state.remainingInventory ?? 0);
        if (total < claimed) {
          throw new ValidationError(`Inventory cannot be set below the ${claimed} already claimed`);
        }
        next.totalInventory = total;
        next.remainingInventory = total - claimed;
      }
    }

    if (input.startsAt !== undefined || input.endsAt !== undefined) {
      const window = normaliseWindow(
        input.startsAt ?? this.state.startsAt?.toISOString(),
        input.endsAt ?? this.state.endsAt?.toISOString(),
      );
      next.startsAt = window.startsAt;
      next.endsAt = window.endsAt;
    }

    if (input.status !== undefined) {
      if (this.state.status === 'ended' && input.status !== 'ended') {
        throw new ConflictError('An ended campaign cannot be reopened');
      }
      next.status = input.status;
    }

    next.updatedAt = new Date();
    this.state = next;
  }

  /**
   * Takes one unit out of stock. The repository enforces this atomically; this
   * keeps the in-memory copy honest for the DTO returned to the caller.
   */
  recordReservation(): void {
    if (!this.isUnlimited) {
      this.state.remainingInventory = Math.max(0, (this.state.remainingInventory ?? 0) - 1);
    }
    this.state.updatedAt = new Date();
  }

  /** Returns a unit to stock after an expiry, cancellation or reversal. */
  restoreInventory(): void {
    if (!this.isUnlimited) {
      const total = this.state.totalInventory ?? 0;
      this.state.remainingInventory = Math.min(total, (this.state.remainingInventory ?? 0) + 1);
    }
    this.state.updatedAt = new Date();
  }
}

function normaliseInventory(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new ValidationError('Inventory must be a whole number of units, or unlimited');
  }
  return value;
}

function normalisePerUserLimit(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError('A per-user limit must be a positive whole number, or unset');
  }
  return value;
}

function normaliseReservationHours(value: number | undefined): number {
  if (value === undefined) return DEFAULT_RESERVATION_HOURS;
  if (!Number.isInteger(value) || value < 1 || value > 24 * 30) {
    throw new ValidationError('Reservations must be held for between 1 hour and 30 days');
  }
  return value;
}

function normaliseWindow(
  startsAt: string | undefined,
  endsAt: string | undefined,
): { startsAt?: Date; endsAt?: Date } {
  const start = startsAt ? new Date(startsAt) : undefined;
  const end = endsAt ? new Date(endsAt) : undefined;
  if (start && Number.isNaN(start.getTime())) throw new ValidationError('Invalid start date');
  if (end && Number.isNaN(end.getTime())) throw new ValidationError('Invalid end date');
  if (start && end && start >= end) {
    throw new ValidationError('A campaign must start before it ends');
  }
  return { startsAt: start, endsAt: end };
}

export function toRewardOfferDTO(o: RewardOffer, institutionName?: string): RewardOfferDTO {
  const s = o.snapshot;
  return {
    id: s.id,
    institutionId: s.institutionId,
    institutionName,
    title: s.title,
    description: s.description,
    category: s.category,
    imageUrl: s.imageUrl,
    pointsCost: s.pointsCost,
    status: s.status,
    totalInventory: s.totalInventory ?? null,
    remainingInventory: s.remainingInventory ?? null,
    startsAt: s.startsAt?.toISOString(),
    endsAt: s.endsAt?.toISOString(),
    perUserLimit: s.perUserLimit ?? null,
    minTrustLevel: s.minTrustLevel,
    reservationHours: s.reservationHours,
    termsUrl: s.termsUrl,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
