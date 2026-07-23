import type { CourierStatus } from './enums.js';
import type { PlaceRef } from './geo.js';

export interface CourierJobDTO {
  id: string;
  itemId: string;
  pickup: PlaceRef;
  dropoff: PlaceRef;
  fee: number;
  currency: string;
  status: CourierStatus;
  riderId?: string;
  requesterId: string;
  pickupCode: string;
  deliveryCode: string;
  createdAt: string;
  updatedAt: string;
  estimatedDistanceKm?: number;
  estimatedDurationMin?: number;
}

export interface CreateCourierJobInput {
  itemId: string;
  pickup: PlaceRef;
  dropoff: PlaceRef;
  fee: number;
}

export interface CourierRouteInput {
  jobIds: string[];
  riderLng?: number;
  riderLat?: number;
}

export interface CourierRouteDTO {
  totalDistanceKm: number;
  estimatedDurationMin: number;
  waypoints: {
    jobId: string;
    pickup: PlaceRef;
    dropoff: PlaceRef;
  }[];
}
