import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Card, Chip, Divider, Text } from 'react-native-paper';

import type { CourierStatus } from '@back2u/shared-types';
import { api } from '../src/lib/api';

const STATUS_ORDER: CourierStatus[] = ['requested', 'accepted', 'picked_up', 'in_transit', 'delivered'];

const STATUS_LABELS: Record<CourierStatus, string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function CourierTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useQuery({
    queryKey: ['courier-job', id],
    queryFn: () => api.getCourierJob(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text>Could not load courier job.</Text>
      </View>
    );
  }

  const activeIndex = STATUS_ORDER.indexOf(job.status);
  const isCancelled = job.status === 'cancelled';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Courier Job {job.id.slice(-6)}</Text>

      <Card>
        <Card.Content style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Chip icon="map-marker">{job.pickup.name}</Chip>
            <Text>→</Text>
            <Chip icon="flag-checkered">{job.dropoff.name}</Chip>
          </View>
          <Text>Fee: {(job.fee / 100).toFixed(2)} {job.currency}</Text>
          {job.estimatedDistanceKm && (
            <Text>Distance: {job.estimatedDistanceKm.toFixed(1)} km</Text>
          )}
          {job.estimatedDurationMin && (
            <Text>Est. time: {job.estimatedDurationMin} min</Text>
          )}
        </Card.Content>
      </Card>

      <Divider />
      <Text variant="titleMedium">Status</Text>

      {isCancelled ? (
        <Card style={{ backgroundColor: '#FEF2F2' }}>
          <Card.Content>
            <Text style={{ color: '#991B1B' }}>This job has been cancelled.</Text>
          </Card.Content>
        </Card>
      ) : (
        STATUS_ORDER.map((status, idx) => (
          <View
            key={status}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 8,
              opacity: idx <= activeIndex ? 1 : 0.4,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: idx <= activeIndex ? '#0F766E' : '#D1D5DB',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>
                {idx <= activeIndex ? '✓' : String(idx + 1)}
              </Text>
            </View>
            <Text style={{ fontWeight: idx === activeIndex ? 'bold' : 'normal' }}>
              {STATUS_LABELS[status]}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
