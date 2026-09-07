import type { BusinessRulesDTO, UpdateBusinessRulesInput } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { toBusinessRulesDTO } from '../../../domain/rules/business-rules.entity.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IBusinessRulesRepository } from '../../ports/points-repos.js';
import type { IAuditLogRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class GetBusinessRulesUseCase {
  constructor(
    @inject(TOKENS.BusinessRulesRepository) private readonly rules: IBusinessRulesRepository,
  ) {}

  async execute(): Promise<BusinessRulesDTO> {
    return toBusinessRulesDTO(await this.rules.get());
  }
}

/**
 * Retunes the economy (§18). Every change is audit-logged with the previous and
 * next values — spec §17 requires an immutable-style trail for sensitive admin
 * actions, and a silently-edited multiplier is exactly that.
 */
@injectable()
export class UpdateBusinessRulesUseCase {
  constructor(
    @inject(TOKENS.BusinessRulesRepository) private readonly rules: IBusinessRulesRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(input: UpdateBusinessRulesInput, actorId: Id): Promise<BusinessRulesDTO> {
    const rules = await this.rules.get();
    const before = toBusinessRulesDTO(rules);

    rules.update(input, actorId);
    await this.rules.save(rules);

    const after = toBusinessRulesDTO(rules);
    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId,
        action: 'businessRules.update',
        entity: 'business_rules',
        entityId: 'singleton',
        meta: { changed: Object.keys(input), before, after },
      }),
    );

    return after;
  }
}
