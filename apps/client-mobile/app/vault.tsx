import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function VaultScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['vault'], queryFn: () => api.listVault() });
  const [form, setForm] = useState({ label: '', category: 'Phone', serialNumber: '', imei: '', notes: '' });

  const create = useMutation({
    mutationFn: () => api.createVaultEntry(form),
    onSuccess: () => { setForm({ label: '', category: 'Phone', serialNumber: '', imei: '', notes: '' }); qc.invalidateQueries({ queryKey: ['vault'] }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteVaultEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] }),
  });

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text variant="headlineSmall">Memory vault</Text>
      <TextInput label="Label" value={form.label} onChangeText={(v) => setForm({ ...form, label: v })} />
      <TextInput label="Category" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
      <TextInput label="Serial number" value={form.serialNumber} onChangeText={(v) => setForm({ ...form, serialNumber: v })} />
      <TextInput label="IMEI" value={form.imei} onChangeText={(v) => setForm({ ...form, imei: v })} />
      <TextInput label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
      <Button mode="contained" onPress={() => create.mutate()} disabled={!form.label} loading={create.isPending}>Save</Button>
      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <Card>
            <Card.Title title={item.label} subtitle={item.category} />
            <Card.Content>
              {item.serialNumber && <Text>SN: {item.serialNumber}</Text>}
              {item.imei && <Text>IMEI: {item.imei}</Text>}
              {item.notes && <Text>{item.notes}</Text>}
            </Card.Content>
            <Card.Actions><Button onPress={() => remove.mutate(item.id)}>Delete</Button></Card.Actions>
          </Card>
        )}
      />
    </View>
  );
}
