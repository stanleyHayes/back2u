import type { TagStatus } from './enums.js';
import type { GeoPoint } from './geo.js';

export interface QrTagDTO {
  id: string;
  code: string;
  ownerId?: string;
  itemLabel?: string;
  status: TagStatus;
  lastSeenAt?: string;
  lastSeenAt_point?: GeoPoint;
  createdAt: string;
}

export interface BleHeartbeatInput {
  tagCode: string;
  point: { lng: number; lat: number };
  rssi?: number;
}

export interface AnonymousScanContact {
  message: string;
  finderEmail?: string;
}

export interface QrTagProductDTO {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  createdAt: string;
}

export interface QrTagOrderItemDTO {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  tagsPerPack: number;
}

export interface QrTagOrderDTO {
  id: string;
  userId: string;
  products: QrTagOrderItemDTO[];
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'fulfilled';
  createdAt: string;
}
