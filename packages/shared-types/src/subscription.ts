export type GeoPolygon = {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON polygon
};

export interface ZoneSubscriptionDTO {
  id: string;
  ownerId: string;
  name: string;
  polygon: GeoPolygon;
  channels: ('push' | 'email' | 'sms')[];
  createdAt: string;
}

export interface CreateZoneSubscriptionInput {
  name: string;
  polygon: GeoPolygon;
  channels?: ('push' | 'email' | 'sms')[];
}
