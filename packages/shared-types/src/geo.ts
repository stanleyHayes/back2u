export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface PlaceRef {
  name: string;
  city?: string;
  country?: string;
  point: GeoPoint;
}

/** A geocoded place suggestion returned by the place-search endpoint. */
export interface PlaceSuggestionDTO {
  name: string;
  lng: number;
  lat: number;
  city?: string;
  country?: string;
}
