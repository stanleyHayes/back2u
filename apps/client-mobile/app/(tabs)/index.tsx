import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { api } from '../../src/lib/api';

export default function FeedScreen() {
  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.listItems({ pageSize: 30 }),
  });

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        refreshing={isRefetching}
        onRefresh={refetch}
        data={data?.items ?? []}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <Link href={`/items/${item.id}`} asChild>
            <Card>
              {item.images[0] && (
                <Card.Cover source={{ uri: item.images[0].url }} />
              )}
              <Card.Title
                title={item.title}
                subtitle={`${item.kind.toUpperCase()} · ${item.place.name}`}
              />
              <Card.Content>
                <Text variant="bodySmall">{item.description.slice(0, 120)}</Text>
              </Card.Content>
            </Card>
          </Link>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32 }}>
            No items yet — be the first to post one.
          </Text>
        }
      />
    </View>
  );
}
