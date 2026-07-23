import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function CourierScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['courier-open'], queryFn: () => api.listOpenCourierJobs() });
  const [form, setForm] = useState({ itemId: '', pickup: '', dropoff: '', fee: '30' });
  const [err, setErr] = useState<string | null>(null);

  const myJobs = useQuery({ queryKey: ['courier-my'], queryFn: () => api.listMyCourierJobs() });

  const request = useMutation({
    mutationFn: async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') throw new Error('Location permission denied');
      const pos = await Location.getCurrentPositionAsync({});
      const point = { type: 'Point' as const, coordinates: [pos.coords.longitude, pos.coords.latitude] as [number, number] };
      return api.requestCourierJob({
        itemId: form.itemId,
        pickup: { name: form.pickup, point },
        dropoff: { name: form.dropoff, point },
        fee: Math.round(Number(form.fee) * 100),
      });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : 'Failed'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courier-open'] });
      qc.invalidateQueries({ queryKey: ['courier-my'] });
    },
  });

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text variant="headlineSmall">Courier recovery</Text>
      <TextInput label="Item ID" value={form.itemId} onChangeText={(v) => setForm({ ...form, itemId: v })} />
      <TextInput label="Pickup place" value={form.pickup} onChangeText={(v) => setForm({ ...form, pickup: v })} />
      <TextInput label="Drop-off place" value={form.dropoff} onChangeText={(v) => setForm({ ...form, dropoff: v })} />
      <TextInput label={`Fee (${DEFAULT_CURRENCY})`} value={form.fee} onChangeText={(v) => setForm({ ...form, fee: v })} keyboardType="numeric" />
      {err && <HelperText type="error">{err}</HelperText>}
      <Button mode="contained" onPress={() => request.mutate()} disabled={!form.itemId} loading={request.isPending}>Request</Button>
      <Text variant="titleMedium">My jobs</Text>
      <FlatList
        data={myJobs.data ?? []}
        keyExtractor={(j) => j.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: j }) => (
          <Card>
            <Card.Title title={`Job ${j.id.slice(-6)}`} subtitle={`${j.status}`} />
            <Card.Content><Text>Fee: {(j.fee / 100).toFixed(2)} {j.currency}</Text></Card.Content>
            <Card.Actions>
              <Link href={`/courier-tracking?id=${j.id}`} asChild>
                <Button>Track</Button>
              </Link>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text>No active jobs.</Text>}
      />

      <Text variant="titleMedium">Open jobs</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(j) => j.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: j }) => (
          <Card>
            <Card.Title title={`Job ${j.id.slice(-6)}`} subtitle={`${j.pickup.name} → ${j.dropoff.name}`} />
            <Card.Content><Text>Fee: {(j.fee / 100).toFixed(2)} {j.currency}</Text></Card.Content>
          </Card>
        )}
      />
    </View>
  );
}
