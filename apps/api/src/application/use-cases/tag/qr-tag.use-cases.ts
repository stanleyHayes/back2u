import { randomBytes } from 'node:crypto';

import {
  DEFAULT_CURRENCY,
  type QrTagDTO,
  type QrTagOrderDTO,
  type QrTagProductDTO,
  type TagStatus,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import { geoPoint } from '../../../domain/shared/value-objects.js';
import { QrTag } from '../../../domain/tag/qr-tag.entity.js';
import { QrTagOrder, type QrTagOrderItem } from '../../../domain/tag/qr-tag-order.entity.js';
import type { QrTagProduct } from '../../../domain/tag/qr-tag-product.entity.js';
import type {
  IItemRepository,
  IQrTagRepository,
  IQrTagProductRepository,
  IQrTagOrderRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { IEmailService, ILogger, IRealtimeBus } from '../../ports/services.js';
import type { IAppUrls } from '../../ports/extra-services.js';
import { TOKENS } from '../../ports/tokens.js';
import { PaystackService } from '../../../infrastructure/payments/paystack/paystack.service.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTagCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}

function toQrTagDTO(tag: QrTag): QrTagDTO {
  const s = tag.snapshot;
  return {
    id: s.id,
    code: s.code,
    ownerId: s.ownerId,
    itemLabel: s.itemLabel,
    status: s.status,
    lastSeenAt: s.lastSeenAt?.toISOString(),
    lastSeenAt_point: s.lastSeenPoint,
    createdAt: s.createdAt.toISOString(),
  };
}

function toQrTagProductDTO(p: QrTagProduct): QrTagProductDTO {
  const s = p.snapshot;
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    currency: s.currency,
    quantity: s.quantity,
    createdAt: s.createdAt.toISOString(),
  };
}

function toQrTagOrderDTO(order: QrTagOrder): QrTagOrderDTO {
  const s = order.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    products: s.products.map((p) => ({ ...p })),
    total: s.total,
    currency: s.currency,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

/** Mint the tags an order entitles the buyer to and mark it fulfilled. */
async function fulfilOrder(order: QrTagOrder, tags: IQrTagRepository): Promise<QrTag[]> {
  const minted: QrTag[] = [];
  for (const p of order.snapshot.products) {
    const count = p.quantity * p.tagsPerPack;
    for (let i = 0; i < count; i++) {
      const tag = QrTag.mint({ id: newId(), code: generateTagCode() });
      tag.claim(order.snapshot.userId);
      minted.push(tag);
    }
  }
  if (minted.length > 0) await tags.saveMany(minted);
  order.markFulfilled();
  return minted;
}

export type PayForQrTagOrderResult =
  | { order: QrTagOrderDTO; tags: QrTagDTO[] }
  | { authorizationUrl: string; reference: string };

@injectable()
export class MintQrTagsUseCase {
  constructor(@inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository) {}
  async execute(count: number, roles?: string[]): Promise<QrTagDTO[]> {
    const isAdminOrSuper = roles?.some((r) => ['admin', 'super_admin'].includes(r)) ?? false;
    const max = isAdminOrSuper ? 5000 : 500;
    if (count > max) {
      throw new ValidationError(`Maximum ${max} tags allowed per request`);
    }
    if (!Number.isInteger(count) || count < 1) {
      throw new ValidationError('count must be a positive integer');
    }
    const minted: QrTag[] = [];
    const seen = new Set<string>();
    while (minted.length < count) {
      const code = generateTagCode();
      if (seen.has(code)) continue;
      seen.add(code);
      minted.push(QrTag.mint({ id: newId(), code }));
    }
    await this.tags.saveMany(minted);
    return minted.map(toQrTagDTO);
  }
}

@injectable()
export class ClaimQrTagUseCase {
  constructor(@inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository) {}
  async execute(input: { code: string; itemLabel?: string; ownerId: Id }): Promise<QrTagDTO> {
    const tag = await this.tags.findByCode(input.code);
    if (!tag) throw new NotFoundError('Tag');
    if (tag.snapshot.status !== 'unclaimed') {
      throw new ConflictError('Tag already claimed');
    }
    tag.claim(input.ownerId, input.itemLabel);
    await this.tags.save(tag);
    return toQrTagDTO(tag);
  }
}

@injectable()
export class GetTagByCodeUseCase {
  constructor(@inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository) {}
  async execute(code: string): Promise<QrTagDTO | null> {
    const tag = await this.tags.findByCode(code);
    return tag ? toQrTagDTO(tag) : null;
  }
}

@injectable()
export class ScanQrTagUseCase {
  constructor(
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.AppUrls) private readonly urls: IAppUrls,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}
  async execute(input: { code: string; finderMessage: string; finderEmail?: string }): Promise<{ ownerName?: string; status: TagStatus }> {
    const tag = await this.tags.findByCode(input.code);
    if (!tag) throw new NotFoundError('Tag');
    const s = tag.snapshot;
    if (!s.ownerId) return { status: s.status };

    const owner = await this.users.findById(s.ownerId);
    if (!owner) return { status: s.status };

    const message = input.finderEmail
      ? `${input.finderMessage}\n\nReply to: ${input.finderEmail}`
      : input.finderMessage;
    try {
      await this.email.sendTagScanContact(owner.email, owner.snapshot.name, message, this.urls.tag(input.code));
    } catch (err) {
      this.logger.warn('tag scan email failed', { err: String(err), code: input.code });
    }

    const item = await this.items.findByQrTagCode(input.code);
    this.bus.publishToUser(s.ownerId, 'tag:scanned', {
      code: input.code,
      itemTitle: item?.snapshot.title,
    });
    return { ownerName: owner.snapshot.name.split(' ')[0], status: s.status };
  }
}

@injectable()
export class RecordTagHeartbeatUseCase {
  constructor(@inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository) {}
  async execute(input: { code: string; lng: number; lat: number }): Promise<void> {
    const tag = await this.tags.findByCode(input.code);
    if (!tag) return;
    tag.recordHeartbeat(geoPoint(input.lng, input.lat));
    await this.tags.save(tag);
  }
}

@injectable()
export class MarkTagLostUseCase {
  constructor(@inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository) {}
  async execute(code: string, userId: Id): Promise<QrTagDTO> {
    const tag = await this.tags.findByCode(code);
    if (!tag) throw new NotFoundError('Tag');
    if (tag.snapshot.ownerId !== userId) throw new ForbiddenError('Not your tag');
    tag.markLost();
    await this.tags.save(tag);
    return toQrTagDTO(tag);
  }
}

@injectable()
export class ListMyTagsUseCase {
  constructor(@inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository) {}
  async execute(ownerId: Id): Promise<QrTagDTO[]> {
    const list = await this.tags.listForOwner(ownerId);
    return list.map(toQrTagDTO);
  }
}

@injectable()
export class ListQrTagProductsUseCase {
  constructor(@inject(TOKENS.QrTagProductRepository) private readonly products: IQrTagProductRepository) {}
  async execute(): Promise<QrTagProductDTO[]> {
    const list = await this.products.list();
    return list.map(toQrTagProductDTO);
  }
}

@injectable()
export class CreateQrTagOrderUseCase {
  constructor(
    @inject(TOKENS.QrTagOrderRepository) private readonly orders: IQrTagOrderRepository,
    @inject(TOKENS.QrTagProductRepository) private readonly products: IQrTagProductRepository,
  ) {}
  async execute(input: { userId: Id; items: { productId: Id; quantity: number }[] }): Promise<QrTagOrderDTO> {
    if (input.items.length === 0) throw new ValidationError('Order must contain at least one item');
    const lines: QrTagOrderItem[] = [];
    let currency = DEFAULT_CURRENCY;
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new ValidationError('quantity must be a positive integer');
      }
      const product = await this.products.findById(item.productId);
      if (!product) throw new NotFoundError('Product');
      const p = product.snapshot;
      currency = p.currency;
      lines.push({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: item.quantity,
        tagsPerPack: p.quantity,
      });
    }
    const order = QrTagOrder.create({ id: newId(), userId: input.userId, products: lines, currency });
    await this.orders.save(order);
    return toQrTagOrderDTO(order);
  }
}

@injectable()
export class PayForQrTagOrderUseCase {
  constructor(
    @inject(TOKENS.QrTagOrderRepository) private readonly orders: IQrTagOrderRepository,
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(PaystackService) private readonly paystack: PaystackService,
  ) {}
  async execute(orderId: Id, userId: Id): Promise<PayForQrTagOrderResult> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    if (order.snapshot.userId !== userId) throw new ForbiddenError('Not your order');
    if (order.snapshot.status === 'fulfilled') throw new ConflictError('Order already fulfilled');

    if (order.snapshot.status === 'pending' && this.paystack.isEnabled()) {
      const user = await this.users.findById(userId);
      if (!user) throw new NotFoundError('User');
      const tx = await this.paystack.initializeTransaction({
        amount: order.snapshot.total,
        currency: order.snapshot.currency,
        email: user.email,
        reference: order.snapshot.id,
        metadata: { orderId: order.snapshot.id, kind: 'qr_tag_order' },
      });
      return { authorizationUrl: tx.authorizationUrl, reference: tx.reference };
    }

    // Already paid via webhook, or Paystack not configured (dev/test): settle immediately.
    if (order.snapshot.status === 'pending') order.markPaid();
    const minted = await fulfilOrder(order, this.tags);
    await this.orders.save(order);
    return { order: toQrTagOrderDTO(order), tags: minted.map(toQrTagDTO) };
  }
}

@injectable()
export class FulfilQrTagOrderUseCase {
  constructor(
    @inject(TOKENS.QrTagOrderRepository) private readonly orders: IQrTagOrderRepository,
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(PaystackService) private readonly paystack: PaystackService,
  ) {}
  async execute(orderId: Id, userId: Id): Promise<{ order: QrTagOrderDTO; tags: QrTagDTO[] }> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    if (order.snapshot.userId !== userId) throw new ForbiddenError('Not your order');
    if (order.snapshot.status === 'fulfilled') throw new ConflictError('Order already fulfilled');
    if (order.snapshot.status === 'pending') {
      if (this.paystack.isEnabled()) throw new ConflictError('Order must be paid first');
      order.markPaid();
    }
    const minted = await fulfilOrder(order, this.tags);
    await this.orders.save(order);
    return { order: toQrTagOrderDTO(order), tags: minted.map(toQrTagDTO) };
  }
}

@injectable()
export class HandlePaystackWebhookUseCase {
  constructor(
    @inject(TOKENS.QrTagOrderRepository) private readonly orders: IQrTagOrderRepository,
    @inject(TOKENS.QrTagRepository) private readonly tags: IQrTagRepository,
    @inject(PaystackService) private readonly paystack: PaystackService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}
  async execute(rawBody: string, signature: string | undefined): Promise<{ received: true }> {
    if (!signature || !this.paystack.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedError('Invalid Paystack signature');
    }
    const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    if (event.event !== 'charge.success' || !event.data?.reference) {
      return { received: true };
    }
    const order = await this.orders.findById(event.data.reference);
    if (!order) {
      this.logger.warn('paystack webhook for unknown order', { reference: event.data.reference });
      return { received: true };
    }
    if (order.snapshot.status === 'pending') {
      order.markPaid();
      await fulfilOrder(order, this.tags);
      await this.orders.save(order);
    }
    return { received: true };
  }
}

@injectable()
export class ListMyQrTagOrdersUseCase {
  constructor(@inject(TOKENS.QrTagOrderRepository) private readonly orders: IQrTagOrderRepository) {}
  async execute(userId: Id): Promise<QrTagOrderDTO[]> {
    const list = await this.orders.listForUser(userId);
    return list.map(toQrTagOrderDTO);
  }
}
