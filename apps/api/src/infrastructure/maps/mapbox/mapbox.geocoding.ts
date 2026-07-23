import { inject, injectable } from 'inversify';

import type { IErrorReporter, IGeocodingService, ILogger } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

interface MapboxContextEntry {
  id: string;
  text: string;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  context?: MapboxContextEntry[];
}

interface MapboxGeocodeResponse {
  features: MapboxFeature[];
}

interface GeocodedPlace {
  name: string;
  lng: number;
  lat: number;
  city?: string;
  country?: string;
}

const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

function toPlace(f: MapboxFeature): GeocodedPlace {
  const place: GeocodedPlace = { name: f.place_name, lng: f.center[0], lat: f.center[1] };
  for (const c of f.context ?? []) {
    if (c.id.startsWith('place.') || c.id.startsWith('locality.')) place.city = c.text;
    if (c.id.startsWith('country.')) place.country = c.text;
  }
  return place;
}

@injectable()
export class MapboxGeocoding implements IGeocodingService {
  private readonly token: string | null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.ErrorReporter) private readonly reporter: IErrorReporter,
  ) {
    this.token = env.MAPBOX_TOKEN ?? null;
  }

  async forward(query: string): Promise<GeocodedPlace | null> {
    const results = await this.search(query, { limit: 1 });
    return results[0] ?? null;
  }

  async suggest(
    query: string,
    opts: { limit?: number; proximity?: { lng: number; lat: number }; country?: string } = {},
  ): Promise<GeocodedPlace[]> {
    return this.search(query, {
      limit: opts.limit ?? 5,
      proximity: opts.proximity,
      country: opts.country,
      types: 'place,locality,neighborhood,address,poi',
    });
  }

  async reverse(lng: number, lat: number): Promise<GeocodedPlace | null> {
    const results = await this.search(`${lng},${lat}`, { limit: 1 });
    return results[0] ?? null;
  }

  private async search(
    query: string,
    opts: { limit: number; proximity?: { lng: number; lat: number }; country?: string; types?: string },
  ): Promise<GeocodedPlace[]> {
    if (!this.token) {
      this.logger.warn('MAPBOX_TOKEN not set — geocoding disabled');
      return [];
    }
    const q = query.trim();
    if (!q) return [];
    try {
      const params = new URLSearchParams({
        access_token: this.token,
        limit: String(opts.limit),
      });
      if (opts.proximity) params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
      if (opts.country) params.set('country', opts.country);
      if (opts.types) params.set('types', opts.types);
      const res = await fetch(`${BASE_URL}/${encodeURIComponent(q)}.json?${params}`);
      if (!res.ok) {
        this.logger.warn('mapbox geocoding failed', { status: res.status });
        return [];
      }
      const json = (await res.json()) as MapboxGeocodeResponse;
      return (json.features ?? []).map(toPlace);
    } catch (err) {
      this.logger.warn('mapbox geocoding error', { err: String(err) });
      this.reporter.report(err instanceof Error ? err : new Error(String(err)), {
        channel: 'maps.mapbox',
      });
      return [];
    }
  }
}
