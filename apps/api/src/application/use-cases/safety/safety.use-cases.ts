import { inject, injectable } from 'inversify';

import type { SafetyReportDTO } from '@back2u/shared-types';

import { Block } from '../../../domain/safety/block.entity.js';
import { Report, type ReportReason, type ReportTarget } from '../../../domain/safety/report.entity.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IBlockRepository, IReportRepository } from '../../ports/safety-repos.js';
import { TOKENS } from '../../ports/tokens.js';

function toReportDTO(r: Report): SafetyReportDTO {
  const s = r.snapshot;
  return {
    id: s.id,
    reporterId: s.reporterId,
    target: s.target,
    targetId: s.targetId,
    reason: s.reason,
    note: s.note,
    status: s.status,
    reviewerId: s.reviewerId,
    reviewerNote: s.reviewerNote,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
  };
}

@injectable()
export class BlockUserUseCase {
  constructor(@inject(TOKENS.BlockRepository) private readonly blocks: IBlockRepository) {}

  async execute(userId: Id, blockedId: Id): Promise<{ ok: true }> {
    if (userId === blockedId) throw new ValidationError('Cannot block yourself');
    if (!(await this.blocks.exists(userId, blockedId))) {
      await this.blocks.save(Block.create({ id: newId(), blockerId: userId, blockedId }));
    }
    return { ok: true };
  }
}

@injectable()
export class UnblockUserUseCase {
  constructor(@inject(TOKENS.BlockRepository) private readonly blocks: IBlockRepository) {}

  async execute(userId: Id, blockedId: Id): Promise<{ ok: true }> {
    await this.blocks.delete(userId, blockedId);
    return { ok: true };
  }
}

@injectable()
export class ListBlocksUseCase {
  constructor(@inject(TOKENS.BlockRepository) private readonly blocks: IBlockRepository) {}

  async execute(userId: Id): Promise<{ blockedId: Id; createdAt: string }[]> {
    const list = await this.blocks.listForUser(userId);
    return list.map((b) => ({ blockedId: b.snapshot.blockedId, createdAt: b.snapshot.createdAt.toISOString() }));
  }
}

@injectable()
export class FileReportUseCase {
  constructor(@inject(TOKENS.ReportRepository) private readonly reports: IReportRepository) {}

  async execute(
    userId: Id,
    input: { target: ReportTarget; targetId: Id; reason: ReportReason; note?: string },
  ): Promise<{ id: Id }> {
    const report = Report.file({
      id: newId(),
      reporterId: userId,
      target: input.target,
      targetId: input.targetId,
      reason: input.reason,
      note: input.note,
    });
    await this.reports.save(report);
    return { id: report.snapshot.id };
  }
}

@injectable()
export class DecideReportUseCase {
  constructor(@inject(TOKENS.ReportRepository) private readonly reports: IReportRepository) {}

  async execute(
    reviewerId: Id,
    reportId: Id,
    decision: 'action' | 'dismiss' | 'resolved',
    note?: string,
  ): Promise<{ ok: true }> {
    const report = await this.reports.findById(reportId);
    if (!report) throw new NotFoundError('Report');
    if (report.snapshot.status !== 'open') throw new ConflictError(`Report already ${report.snapshot.status}`);
    if (decision === 'dismiss') {
      report.dismiss(reviewerId, note);
    } else {
      report.action(reviewerId, note);
    }
    await this.reports.save(report);
    return { ok: true };
  }
}

@injectable()
export class ListOpenReportsUseCase {
  constructor(@inject(TOKENS.ReportRepository) private readonly reports: IReportRepository) {}

  async execute(limit = 100): Promise<SafetyReportDTO[]> {
    const list = await this.reports.listOpen(limit);
    return list.map(toReportDTO);
  }
}
