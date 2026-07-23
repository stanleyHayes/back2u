import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function TagsScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['tags'], queryFn: () => api.listMyTags() });
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');

  const claim = useMutation({
    mutationFn: () => api.claimTag(code, label || undefined),
    onSuccess: () => { setCode(''); setLabel(''); qc.invalidateQueries({ queryKey: ['tags'] }); },
  });
  const lost = useMutation({
    mutationFn: (c: string) => api.markTagLost(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text variant="headlineSmall">QR tags</Text>
      <TextInput label="Tag code" value={code} onChangeText={setCode} />
      <TextInput label="Item label" value={label} onChangeText={setLabel} />
      <Button mode="contained" onPress={() => claim.mutate()} disabled={!code} loading={claim.isPending}>Claim</Button>
      <FlatList
        data={data ?? []}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <Card>
            <Card.Title
              title={item.itemLabel ?? item.code}
              subtitle={`code ${item.code}`}
              right={() => <Chip style={{ marginRight: 8 }}>{item.status}</Chip>}
            />
            {item.status !== 'lost' && (
              <Card.Actions>
                <Button onPress={() => lost.mutate(item.code)}>Mark lost</Button>
              </Card.Actions>
            )}
          </Card>
        )}
      />
    </View>
  );
}
