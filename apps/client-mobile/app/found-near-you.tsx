import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Chip, SegmentedButtons, Text } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function FoundNearYouScreen() {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000);

  useEffect(() => {
    Location.getCurrentPositionAsync({}).then((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }).catch(() => {});
  }, []);

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['found-near-you', location?.lat, location?.lng, radius],
    queryFn: () =>
      api.listItems({
        kind: 'found',
        near: location
          ? { lat: location.lat, lng: location.lng, radiusMeters: radius }
          : undefined,
        pageSize: 30,
      }),
    enabled: !!location,
  });

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
        Found Near You
      </Text>

      <SegmentedButtons
        value={view}
        onValueChange={(v) => setView(v as 'list' | 'map')}
        buttons={[
          { value: 'list', label: 'List' },
          { value: 'map', label: 'Map' },
        ]}
        style={{ marginBottom: 12 }}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[1000, 5000, 10000, 50000].map((r) => (
          <Button
            key={r}
            mode={radius === r ? 'contained' : 'outlined'}
            compact
            onPress={() => setRadius(r)}
          >
            {r >= 1000 ? `${r / 1000}km` : `${r}m`}
          </Button>
        ))}
      </View>

      {!location && (
        <Text style={{ textAlign: 'center', marginTop: 32 }}>
          Enable location to see items found near you.
        </Text>
      )}

      {view === 'list' ? (
        <FlatList
          refreshing={isRefetching}
          onRefresh={refetch}
          data={data?.items ?? []}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <Card>
              <Card.Cover source={{ uri: item.images[0]?.url }} />
              <Card.Title
                title={item.title}
                subtitle={item.place.name}
              />
              <Card.Content>
                <Chip>{item.category}</Chip>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 32 }}>
              No found items nearby.
            </Text>
          }
        />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 32 }}>
          Map view coming soon — switch to List view.
        </Text>
      )}
    </View>
  );
}
