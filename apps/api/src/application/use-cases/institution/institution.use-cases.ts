import { createHash, randomBytes } from 'node:crypto';

import type {
  InstitutionDTO,
  InstitutionLeadDTO,
  InstitutionType,
  PlaceRef,
  SubmitInstitutionLeadInput,
  SubscriptionTier,
} from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import {
  InstitutionLead,
  type InstitutionLeadDecision,
} from '../../../domain/institution/institution-lead.entity.js';
import { Institution } from '../../../domain/institution/institution.entity.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type {
  IInstitutionLeadRepository,
  IInstitutionRepository,
} from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(i: Institution): InstitutionDTO {
  const s = i.snapshot;
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    contactEmail: s.contactEmail,
    place: s.place,
    pointsRedeemable: s.pointsRedeemable,
    pointToCurrencyRate: s.pointToCurrencyRate,
    subscriptionTier: s.subscriptionTier,
    subscriptionRenewsAt: s.subscriptionRenewsAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
    rewardsListed: s.rewardsListed,
    logoUrl: s.logoUrl,
    description: s.description,
    website: s.website,
  };
}

function leadToDTO(l: InstitutionLead): InstitutionLeadDTO {
  const s = l.snapshot;
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    contactName: s.contactName,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    city: s.city,
    estimatedVolume: s.estimatedVolume,
    message: s.message,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class OnboardInstitutionUseCase {
  constructor(@inject(TOKENS.InstitutionRepository) private readonly repo: IInstitutionRepository) {}

  async execute(input: {
    name: string;
    type: InstitutionType;
    contactEmail: string;
    place: { name: string; lng: number; lat: number; city?: string; country?: string };
    pointsRedeemable?: boolean;
    pointToCurrencyRate?: number;
    webhookUrl?: string;
  }): Promise<{ institution: InstitutionDTO; apiKey: string }> {
    const apiKey = `b2u_${randomBytes(24).toString('hex')}`;
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
    const place: PlaceRef = {
      name: input.place.name,
      city: input.place.city,
      country: input.place.country,
      point: { type: 'Point', coordinates: [input.place.lng, input.place.lat] },
    };
    const institution = Institution.onboard({
      id: newId(),
      name: input.name,
      type: input.type,
      contactEmail: input.contactEmail,
      place,
      pointsRedeemable: input.pointsRedeemable ?? false,
      pointToCurrencyRate: input.pointToCurrencyRate,
      apiKeyHash,
      webhookUrl: input.webhookUrl,
    });
    await this.repo.save(institution);
    return { institution: toDTO(institution), apiKey };
  }
}

@injectable()
export class ListInstitutionsUseCase {
  constructor(@inject(TOKENS.InstitutionRepository) private readonly repo: IInstitutionRepository) {}

  async execute(limit = 100): Promise<InstitutionDTO[]> {
    const list = await this.repo.list(limit);
    return list.map(toDTO);
  }
}

@injectable()
export class GetInstitutionUseCase {
  constructor(@inject(TOKENS.InstitutionRepository) private readonly repo: IInstitutionRepository) {}

  async execute(id: Id): Promise<InstitutionDTO> {
    const institution = await this.repo.findById(id);
    if (!institution) throw new NotFoundError('Institution');
    return toDTO(institution);
  }
}

@injectable()
export class SubscribeInstitutionUseCase {
  constructor(@inject(TOKENS.InstitutionRepository) private readonly repo: IInstitutionRepository) {}

  async execute(id: Id, tier: SubscriptionTier): Promise<InstitutionDTO> {
    const institution = await this.repo.findById(id);
    if (!institution) throw new NotFoundError('Institution');
    const renewsAt = tier === 'free' ? undefined : new Date(Date.now() + 30 * 86_400_000);
    institution.setSubscription(tier, renewsAt);
    await this.repo.save(institution);
    return toDTO(institution);
  }
}

@injectable()
export class SubmitInstitutionLeadUseCase {
  constructor(@inject(TOKENS.InstitutionLeadRepository) private readonly leads: IInstitutionLeadRepository) {}

  async execute(input: SubmitInstitutionLeadInput): Promise<{ ok: true }> {
    const lead = InstitutionLead.submit({ id: newId(), ...input });
    await this.leads.save(lead);
    return { ok: true };
  }
}

@injectable()
export class ListInstitutionLeadsUseCase {
  constructor(@inject(TOKENS.InstitutionLeadRepository) private readonly leads: IInstitutionLeadRepository) {}

  async execute(limit = 100): Promise<InstitutionLeadDTO[]> {
    const list = await this.leads.list(limit);
    return list.map(leadToDTO);
  }
}

@injectable()
export class DecideInstitutionLeadUseCase {
  constructor(@inject(TOKENS.InstitutionLeadRepository) private readonly leads: IInstitutionLeadRepository) {}

  async execute(id: Id, decision: InstitutionLeadDecision): Promise<InstitutionLeadDTO> {
    const lead = await this.leads.findById(id);
    if (!lead) throw new NotFoundError('Institution lead');
    lead.decide(decision);
    await this.leads.save(lead);
    return leadToDTO(lead);
  }
}
