import type { PoliceCaseRefDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { PoliceCase } from '../../../domain/announcement/police-case.entity.js';
import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IItemRepository,
  IPoliceCaseRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { IPdfReportService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(p: PoliceCase): PoliceCaseRefDTO {
  const s = p.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    caseNumber: s.caseNumber,
    station: s.station,
    pdfUrl: s.pdfUrl,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class GenerateStolenItemReportUseCase {
  constructor(
    @inject(TOKENS.PoliceCaseRepository) private readonly cases: IPoliceCaseRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.PdfReportService) private readonly pdf: IPdfReportService,
  ) {}

  async execute(userId: Id, itemId: Id): Promise<PoliceCaseRefDTO> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.postedById !== userId) throw new ForbiddenError('Not your item');
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');

    const s = item.snapshot;
    const { url } = await this.pdf.buildStolenItemReport({
      item: {
        title: s.title,
        description: s.description,
        serialNumber: s.serialNumber,
        imei: s.imei,
        place: s.place.name,
        occurredAt: s.occurredAt,
      },
      user: { name: user.snapshot.name, email: user.email, phone: user.snapshot.phone },
    });

    const existing = await this.cases.findByItemId(itemId);
    const policeCase = existing ?? PoliceCase.draft({ id: newId(), itemId });
    policeCase.attachReport(url);
    await this.cases.save(policeCase);
    if (!existing) {
      item.attachPoliceCase(policeCase.snapshot.id);
      await this.items.save(item);
    }
    return toDTO(policeCase);
  }
}

@injectable()
export class FilePoliceCaseUseCase {
  constructor(
    @inject(TOKENS.PoliceCaseRepository) private readonly cases: IPoliceCaseRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}

  async execute(userId: Id, caseId: Id, input: { caseNumber: string; station: string }): Promise<PoliceCaseRefDTO> {
    const policeCase = await this.cases.findById(caseId);
    if (!policeCase) throw new NotFoundError('Police case');
    const item = await this.items.findById(policeCase.snapshot.itemId);
    if (!item || item.snapshot.postedById !== userId) throw new ForbiddenError('Not your case');
    policeCase.fileWith(input.caseNumber, input.station);
    await this.cases.save(policeCase);
    return toDTO(policeCase);
  }
}
