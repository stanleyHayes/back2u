import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, Card, ProgressBar, Text } from 'react-native-paper';

import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth.store';

export default function MatchesScreen() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const { data: items } = useQuery({ queryKey: ['my-items', user?.id], queryFn: () => api.listItems({ pageSize: 50 }) });
  const mine = (items?.items ?? []).filter((i) => i.postedById === user?.id);
  const { data: groups } = useQuery({
    queryKey: ['my-matches', mine.map((m) => m.id)],
    queryFn: async () =>
      (
        await Promise.all(mine.map(async (it) => ({ item: it, matches: await api.listMatchesForItem(it.id) })))
      ).filter((g) => g.matches.length > 0),
    enabled: mine.length > 0,
  });

  return (
    <FlatList
      contentContainerStyle={{ padding: 12, gap: 8 }}
      data={groups ?? []}
      keyExtractor={(g) => g.item.id}
      ListEmptyComponent={
        <Text style={{ marginTop: 32, textAlign: 'center' }}>
          No matches yet — we'll notify you the moment AI finds one.
        </Text>
      }
      renderItem={({ item: g }) => (
        <Card>
          <Card.Title title={`For: ${g.item.title}`} />
          <Card.Content>
            {g.matches.map((m) => (
              <View key={m.id} style={{ marginVertical: 8 }}>
                <Text variant="bodySmall">Score {Math.round(m.score * 100)}%</Text>
                <ProgressBar progress={m.score} />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <Button mode="contained" onPress={async () => { await api.acceptMatch(m.id); qc.invalidateQueries({ queryKey: ['my-matches'] }); }}>Accept</Button>
                  <Button onPress={async () => { await api.rejectMatch(m.id); qc.invalidateQueries({ queryKey: ['my-matches'] }); }}>Reject</Button>
                  <Link href={`/items/${m.foundItemId === g.item.id ? m.lostItemId : m.foundItemId}`} asChild>
                    <Button>View</Button>
                  </Link>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    />
  );
}
