import type { Block } from '../../domain/safety/block.entity.js';
import type { Report } from '../../domain/safety/report.entity.js';
import type { Id } from '../../domain/shared/id.js';

export interface IReportRepository {
  save(r: Report): Promise<void>;
  findById(id: Id): Promise<Report | null>;
  listOpen(limit: number): Promise<Report[]>;
}

export interface IBlockRepository {
  save(b: Block): Promise<void>;
  exists(blockerId: Id, blockedId: Id): Promise<boolean>;
  listForUser(blockerId: Id): Promise<Block[]>;
  delete(blockerId: Id, blockedId: Id): Promise<void>;
}
