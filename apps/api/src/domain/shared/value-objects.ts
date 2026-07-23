import type { GeoPoint, PlaceRef } from '@back2u/shared-types';

import { ValidationError } from './errors.js';

export const geoPoint = (lng: number, lat: number): GeoPoint => {
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new ValidationError('Invalid coordinates');
  }
  return { type: 'Point', coordinates: [lng, lat] };
};

export const place = (input: {
  name: string;
  city?: string;
  country?: string;
  lng: number;
  lat: number;
}): PlaceRef => ({
  name: input.name.trim(),
  city: input.city,
  country: input.country,
  point: geoPoint(input.lng, input.lat),
});

export const haversineMeters = (a: GeoPoint, b: GeoPoint): number => {
  const [lng1, lat1] = a.coordinates;
  const [lng2, lat2] = b.coordinates;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
