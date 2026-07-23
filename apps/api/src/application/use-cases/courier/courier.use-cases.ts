import {
  DEFAULT_CURRENCY,
  type CourierJobDTO,
  type CourierRouteDTO,
  type CreateCourierJobInput,
  type PlaceRef,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { generate6DigitCode } from '../../../domain/auth/otp.entity.js';
import { CourierJob } from '../../../domain/courier/courier-job.entity.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { ICourierJobRepository, IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

const COURIER_SPEED_KMH = 30;
const DEFAULT_NEARBY_RADIUS_METERS = 10_000;

export type CourierTransition = 'pickup' | 'in_transit' | 'deliver' | 'cancel';

function toDTO(
  job: CourierJob,
  extra?: { estimatedDistanceKm?: number; estimatedDurationMin?: number },
): CourierJobDTO {
  const s = job.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    pickup: s.pickup,
    dropoff: s.dropoff,
    fee: s.fee,
    currency: s.currency,
    status: s.status,
    riderId: s.riderId,
    requesterId: s.requesterId,
    pickupCode: s.pickupCode,
    deliveryCode: s.deliveryCode,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    ...extra,
  };
}

function haversineKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const pointOf = (p: PlaceRef): { lng: number; lat: number } => ({
  lng: p.point.coordinates[0],
  lat: p.point.coordinates[1],
});

const estimateDurationMin = (km: number): number => Math.max(1, Math.round((km / COURIER_SPEED_KMH) * 60));

@injectable()
export class RequestCourierJobUseCase {
  constructor(
    @inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}
  async execute(requesterId: Id, input: CreateCourierJobInput): Promise<CourierJobDTO> {
    const item = await this.items.findById(input.itemId);
    if (!item) throw new NotFoundError('Item');
    const job = CourierJob.request({
      id: newId(),
      itemId: input.itemId,
      pickup: input.pickup,
      dropoff: input.dropoff,
      fee: input.fee,
      currency: DEFAULT_CURRENCY,
      requesterId,
      pickupCode: generate6DigitCode(),
      deliveryCode: generate6DigitCode(),
    });
    await this.jobs.save(job);
    return toDTO(job);
  }
}

@injectable()
export class AcceptCourierJobUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(jobId: Id, riderId: Id): Promise<CourierJobDTO> {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Courier job');
    job.acceptedBy(riderId);
    await this.jobs.save(job);
    return toDTO(job);
  }
}

@injectable()
export class TransitionCourierJobUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(jobId: Id, actorId: Id, transition: CourierTransition, code?: string): Promise<CourierJobDTO> {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Courier job');
    const s = job.snapshot;
    if (transition === 'cancel') {
      if (actorId !== s.requesterId && actorId !== s.riderId) throw new ForbiddenError();
      job.cancel();
    } else {
      if (actorId !== s.riderId) throw new ForbiddenError('Only the assigned rider can do this');
      if (transition === 'pickup') {
        if (!code) throw new ValidationError('Pickup code required');
        job.pickup(code);
      } else if (transition === 'in_transit') {
        job.inTransit();
      } else {
        if (!code) throw new ValidationError('Delivery code required');
        job.deliver(code);
      }
    }
    await this.jobs.save(job);
    return toDTO(job);
  }
}

@injectable()
export class ListOpenCourierJobsUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(near?: { lng: number; lat: number; radiusMeters: number }): Promise<CourierJobDTO[]> {
    const jobs = await this.jobs.listOpen(near);
    return jobs.map((j) => toDTO(j));
  }
}

@injectable()
export class ListNearbyCourierJobsUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(near: { lng: number; lat: number; radiusMeters?: number }): Promise<CourierJobDTO[]> {
    const origin = { lng: near.lng, lat: near.lat };
    const jobs = await this.jobs.listOpen({
      lng: near.lng,
      lat: near.lat,
      radiusMeters: near.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS,
    });
    return jobs
      .map((j) => {
        const km = haversineKm(origin, pointOf(j.snapshot.pickup));
        return {
          km,
          dto: toDTO(j, {
            estimatedDistanceKm: Number(km.toFixed(2)),
            estimatedDurationMin: estimateDurationMin(km),
          }),
        };
      })
      .sort((a, b) => a.km - b.km)
      .map((x) => x.dto);
  }
}

@injectable()
export class CalculateRouteUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(input: { jobIds: Id[]; riderLng?: number; riderLat?: number }): Promise<CourierRouteDTO> {
    const remaining: CourierJob[] = [];
    for (const id of input.jobIds) {
      const job = await this.jobs.findById(id);
      if (!job) throw new NotFoundError('Courier job');
      remaining.push(job);
    }
    let current =
      input.riderLng !== undefined && input.riderLat !== undefined
        ? { lng: input.riderLng, lat: input.riderLat }
        : remaining.length > 0
          ? pointOf(remaining[0]!.snapshot.pickup)
          : { lng: 0, lat: 0 };
    let totalKm = 0;
    const waypoints: CourierRouteDTO['waypoints'] = [];
    // Nearest-neighbor ordering: always visit the closest remaining pickup next.
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestKm = Infinity;
      remaining.forEach((job, idx) => {
        const km = haversineKm(current, pointOf(job.snapshot.pickup));
        if (km < bestKm) {
          bestKm = km;
          bestIdx = idx;
        }
      });
      const [next] = remaining.splice(bestIdx, 1);
      const s = next!.snapshot;
      totalKm += bestKm + haversineKm(pointOf(s.pickup), pointOf(s.dropoff));
      waypoints.push({ jobId: s.id, pickup: s.pickup, dropoff: s.dropoff });
      current = pointOf(s.dropoff);
    }
    return {
      totalDistanceKm: Number(totalKm.toFixed(2)),
      estimatedDurationMin: estimateDurationMin(totalKm),
      waypoints,
    };
  }
}

@injectable()
export class GetCourierJobUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(jobId: Id, userId: Id): Promise<CourierJobDTO> {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Courier job');
    const s = job.snapshot;
    if (s.requesterId !== userId && s.riderId !== userId) throw new ForbiddenError();
    return toDTO(job);
  }
}

@injectable()
export class ListMyCourierJobsUseCase {
  constructor(@inject(TOKENS.CourierJobRepository) private readonly jobs: ICourierJobRepository) {}
  async execute(userId: Id): Promise<CourierJobDTO[]> {
    const jobs = await this.jobs.listForUser(userId);
    return jobs.map((j) => toDTO(j));
  }
}
