import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function ZonesScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['zones'], queryFn: () => api.listZones() });
  const [name, setName] = useState('');
  const [poly, setPoly] = useState('[[-0.21,5.59],[-0.16,5.59],[-0.16,5.62],[-0.21,5.62],[-0.21,5.59]]');
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => {
      let coords: [number, number][];
      try {
        coords = JSON.parse(poly) as [number, number][];
      } catch (e) {
        throw new Error('Invalid polygon JSON');
      }
      return api.createZone({
        name,
        polygon: { type: 'Polygon', coordinates: [coords] },
      });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : 'Failed'),
    onSuccess: () => { setName(''); setErr(null); qc.invalidateQueries({ queryKey: ['zones'] }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text variant="headlineSmall">Zone alerts</Text>
      <TextInput label="Zone name" value={name} onChangeText={setName} />
      <TextInput label="Polygon coords [[lng,lat],…]" value={poly} onChangeText={setPoly} multiline />
      {err && <HelperText type="error">{err}</HelperText>}
      <Button mode="contained" onPress={() => create.mutate()} disabled={!name} loading={create.isPending}>Save zone</Button>
      <FlatList
        data={data ?? []}
        keyExtractor={(z) => z.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: z }) => (
          <Card>
            <Card.Title title={z.name} subtitle={z.channels.join(', ')} />
            <Card.Actions><Button textColor="red" onPress={() => remove.mutate(z.id)}>Delete</Button></Card.Actions>
          </Card>
        )}
      />
    </View>
  );
}
