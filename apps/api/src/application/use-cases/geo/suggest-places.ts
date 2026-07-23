import type { PlaceSuggestionDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { IGeocodingService } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class SuggestPlacesUseCase {
  constructor(@inject(TOKENS.GeocodingService) private readonly geocoding: IGeocodingService) {}

  // Routes call this either as execute(query, opts) or execute({ q, limit, lng, lat }).
  async execute(
    query: string,
    opts?: { limit?: number; proximity?: { lng: number; lat: number } },
  ): Promise<PlaceSuggestionDTO[]>;
  async execute(input: {
    q: string;
    limit?: number;
    lng?: number;
    lat?: number;
  }): Promise<PlaceSuggestionDTO[]>;
  async execute(
    a: string | { q: string; limit?: number; lng?: number; lat?: number },
    b?: { limit?: number; proximity?: { lng: number; lat: number } },
  ): Promise<PlaceSuggestionDTO[]> {
    const query = typeof a === 'string' ? a : a.q;
    const limit = typeof a === 'string' ? b?.limit : a.limit;
    const proximity =
      typeof a === 'string'
        ? b?.proximity
        : a.lng !== undefined && a.lat !== undefined
          ? { lng: a.lng, lat: a.lat }
          : undefined;
    return this.geocoding.suggest(query, { limit: limit ?? 5, proximity });
  }
}
