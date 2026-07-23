import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function MarketplaceScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['marketplace'], queryFn: () => api.listMarketplace() });
  const [bids, setBids] = useState<Record<string, string>>({});
  const placeBid = useMutation({
    mutationFn: (input: { listingId: string; amount: number }) => api.placeBid(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  });

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text variant="headlineSmall">Unclaimed marketplace</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(l) => l.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <Card>
            <Card.Title title={`Listing ${item.id.slice(-6)}`} subtitle={`Starts at ${item.startingPrice} ${item.currency}`} />
            <Card.Content>
              <Text>Closes {new Date(item.closesAt).toLocaleString()}</Text>
              {item.charityRecipient && <Text>Charity: {item.charityRecipient}</Text>}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Bid"
                  value={bids[item.id] ?? ''}
                  onChangeText={(v) => setBids({ ...bids, [item.id]: v })}
                  keyboardType="numeric"
                  dense
                />
                <Button mode="contained" onPress={() => {
                  const amount = Math.round(Number(bids[item.id] ?? '0') * 100);
                  if (amount > 0) placeBid.mutate({ listingId: item.id, amount });
                }}>Bid</Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}
