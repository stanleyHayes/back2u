import type { ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IItemRepository } from '../../ports/repositories.js';
import type { IImageStorage, IPerceptualHashService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { toItemDTO } from '../mappers/item.mapper.js';

const DUPLICATE_HAMMING_THRESHOLD = 10;

@injectable()
export class DetectDuplicateItemUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.ImageStorage) private readonly imageStorage: IImageStorage,
    @inject(TOKENS.PerceptualHash) private readonly phash: IPerceptualHashService,
  ) {}

  async execute(itemId: Id): Promise<{ item: ItemDTO; duplicates: ItemDTO[] }> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');

    let hash = item.snapshot.perceptualHash;
    if (!hash) {
      const image = item.snapshot.images[0];
      if (!image) return { item: toItemDTO(item), duplicates: [] };
      const bytes = await this.imageStorage.fetchBytes(image.url);
      hash = await this.phash.hash(bytes);
      item.setPerceptualHash(hash);
    }

    const candidates = await this.items.findByPerceptualHash(hash, DUPLICATE_HAMMING_THRESHOLD);
    const duplicates = candidates.filter(
      (c) =>
        c.id !== item.id &&
        c.snapshot.perceptualHash !== undefined &&
        this.phash.isDuplicate(hash, c.snapshot.perceptualHash, DUPLICATE_HAMMING_THRESHOLD),
    );

    const first = duplicates[0];
    if (first && !item.snapshot.duplicateOfId) item.markDuplicateOf(first.id);
    await this.items.save(item);

    return { item: toItemDTO(item), duplicates: duplicates.map((d) => toItemDTO(d)) };
  }
}
