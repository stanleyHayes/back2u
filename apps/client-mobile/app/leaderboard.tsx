import { useQuery } from '@tanstack/react-query';
import { FlatList, View } from 'react-native';
import { Avatar, Card, Chip, Text } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function LeaderboardScreen() {
  const { data } = useQuery({ queryKey: ['leaderboard'], queryFn: () => api.getLeaderboard(50) });
  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>Top finders</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.userId}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: e }) => (
          <Card>
            <Card.Title
              title={`#${e.rank}  ${e.name}`}
              subtitle={`${e.pointsBalance} pts · ${e.successfulReturns} returns`}
              left={(p) => <Avatar.Text {...p} label={(e.name[0] ?? '?').toUpperCase()} />}
            />
            <Card.Content style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {e.badges.map((b) => <Chip key={b}>{b.replace('_', ' ')}</Chip>)}
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}
