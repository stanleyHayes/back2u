import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, type Region } from 'react-native-maps';
import { Button, Chip, Text } from 'react-native-paper';

import type { ItemDTO } from '@back2u/shared-types';

import { api } from '../src/lib/api';

type FilterKind = 'all' | 'lost' | 'found';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DEFAULT_REGION: Region = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

function getMarkerColor(kind: ItemDTO['kind']): string {
  return kind === 'lost' ? '#EF4444' : '#22C55E';
}

function coordsFromItem(item: ItemDTO): { latitude: number; longitude: number } | null {
  const [lng, lat] = item.place.point.coordinates;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { latitude: lat, longitude: lng };
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [filter, setFilter] = useState<FilterKind>('all');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['items-map'],
    queryFn: () => api.listItems({ pageSize: 100 }),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setPermissionStatus(status);
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data?.items ?? [];
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.kind === filter;
  });

  const validItems = filteredItems.filter((item) => coordsFromItem(item) !== null);

  const fitToMarkers = useCallback(() => {
    const coordinates = validItems.map(coordsFromItem).filter(Boolean) as {
      latitude: number;
      longitude: number;
    }[];
    if (coordinates.length === 0) return;

    if (coordinates.length === 1 && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...coordinates[0],
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        500,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
      animated: true,
    });
  }, [validItems]);

  useEffect(() => {
    if (!isLoading && validItems.length > 0) {
      const id = setTimeout(fitToMarkers, 300);
      return () => clearTimeout(id);
    }
  }, [isLoading, validItems.length, fitToMarkers]);

  const goToMyLocation = async () => {
    if (permissionStatus !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    setUserLocation(coords);
    mapRef.current?.animateToRegion(
      {
        ...coords,
        latitudeDelta: LATITUDE_DELTA / 4,
        longitudeDelta: LONGITUDE_DELTA / 4,
      },
      500,
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={{ marginTop: 12 }}>Loading map…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginBottom: 12, color: '#EF4444' }}>
          {error instanceof Error ? error.message : 'Failed to load items'}
        </Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={permissionStatus === 'granted'}
        showsMyLocationButton={false}
      >
        {validItems.map((item) => {
          const coords = coordsFromItem(item)!;
          return (
            <Marker
              key={item.id}
              coordinate={coords}
              pinColor={getMarkerColor(item.kind)}
              onCalloutPress={() => router.push(`/items/${item.id}`)}
            >
              <Callout tooltip={false}>
                <View style={{ padding: 4, minWidth: 140 }}>
                  <Text
                    style={{ fontWeight: '700', fontSize: 14, marginBottom: 2 }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={1}>
                    {item.place.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#0F766E', marginTop: 4 }}>
                    Tap for details →
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* My location button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={goToMyLocation} activeOpacity={0.8}>
        <View style={styles.myLocationCircle}>
          <Text style={{ fontSize: 18 }}>📍</Text>
        </View>
      </TouchableOpacity>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
          showSelectedOverlay
        >
          All
        </Chip>
        <Chip
          selected={filter === 'lost'}
          onPress={() => setFilter('lost')}
          style={styles.filterChip}
          showSelectedOverlay
        >
          Lost
        </Chip>
        <Chip
          selected={filter === 'found'}
          onPress={() => setFilter('found')}
          style={styles.filterChip}
          showSelectedOverlay
        >
          Found
        </Chip>
      </View>

      {/* Empty state overlay */}
      {validItems.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>No items nearby</Text>
            <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              Try changing the filter or check back later.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 100,
  },
  myLocationCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#fff',
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
