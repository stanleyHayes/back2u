import type { SupportedCurrency } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface QrTagOrderItem {
  productId: Id;
  name: string;
  price: number;
  quantity: number;
  tagsPerPack: number;
}

export interface QrTagOrderSnapshot {
  id: Id;
  userId: Id;
  products: QrTagOrderItem[];
  total: number;
  currency: SupportedCurrency;
  status: 'pending' | 'paid' | 'fulfilled';
  createdAt: Date;
}

export class QrTagOrder {
  private constructor(private state: QrTagOrderSnapshot) {}

  static create(input: {
    id: Id;
    userId: Id;
    products: QrTagOrderItem[];
    currency: SupportedCurrency;
  }): QrTagOrder {
    const total = input.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    return new QrTagOrder({
      ...input,
      total,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  static rehydrate(s: QrTagOrderSnapshot): QrTagOrder {
    return new QrTagOrder({ ...s });
  }

  get snapshot(): QrTagOrderSnapshot {
    return { ...this.state };
  }

  markPaid(): void {
    if (this.state.status !== 'pending') {
      throw new Error('Order must be pending to pay');
    }
    this.state.status = 'paid';
  }

  markFulfilled(): void {
    if (this.state.status !== 'paid') {
      throw new Error('Order must be paid to fulfil');
    }
    this.state.status = 'fulfilled';
  }
}
