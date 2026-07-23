import type { SupportedCurrency } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface QrTagProductSnapshot {
  id: Id;
  name: string;
  description?: string;
  price: number;
  currency: SupportedCurrency;
  quantity: number;
  createdAt: Date;
}

export class QrTagProduct {
  private constructor(private state: QrTagProductSnapshot) {}

  static create(input: Omit<QrTagProductSnapshot, 'createdAt'>): QrTagProduct {
    return new QrTagProduct({
      ...input,
      createdAt: new Date(),
    });
  }

  static rehydrate(s: QrTagProductSnapshot): QrTagProduct {
    return new QrTagProduct({ ...s });
  }

  get snapshot(): QrTagProductSnapshot {
    return { ...this.state };
  }
}
