import { injectable } from 'inversify';

import type { IBlockRepository, IReportRepository } from '../../../../application/ports/safety-repos.js';
import { Block, type BlockSnapshot } from '../../../../domain/safety/block.entity.js';
import { Report, type ReportSnapshot } from '../../../../domain/safety/report.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { BlockModel, ReportModel } from '../models/safety.model.js';

type BlockDoc = Omit<BlockSnapshot, 'id'> & { _id: unknown };
type ReportDoc = Omit<ReportSnapshot, 'id'> & { _id: unknown };

const blockToSnapshot = (d: BlockDoc): BlockSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};
const reportToSnapshot = (d: ReportDoc): ReportSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoBlockRepository implements IBlockRepository {
  async save(b: Block): Promise<void> {
    const { id, ...rest } = b.snapshot;
    await BlockModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async exists(blockerId: Id, blockedId: Id): Promise<boolean> {
    const found = await BlockModel.exists({ blockerId, blockedId });
    return found !== null;
  }

  async listForUser(blockerId: Id): Promise<Block[]> {
    const docs = await BlockModel.find({ blockerId }).sort({ createdAt: -1 }).lean<BlockDoc[]>();
    return docs.map((d) => Block.rehydrate(blockToSnapshot(d)));
  }

  async delete(blockerId: Id, blockedId: Id): Promise<void> {
    await BlockModel.deleteOne({ blockerId, blockedId });
  }
}

@injectable()
export class MongoReportRepository implements IReportRepository {
  async save(r: Report): Promise<void> {
    const { id, ...rest } = r.snapshot;
    await ReportModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<Report | null> {
    const doc = await ReportModel.findById(id).lean<ReportDoc>();
    return doc ? Report.rehydrate(reportToSnapshot(doc)) : null;
  }

  async listOpen(limit: number): Promise<Report[]> {
    const docs = await ReportModel.find({ status: 'open' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<ReportDoc[]>();
    return docs.map((d) => Report.rehydrate(reportToSnapshot(d)));
  }
}
