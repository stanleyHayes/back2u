import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function BookmarksScreen() {
  const qc = useQueryClient();
  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.listBookmarks(),
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => api.unbookmarkItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const items = (data?.map((b) => b.item).filter((i): i is NonNullable<typeof i> => !!i) ?? []);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
        Bookmarks
      </Text>
      <FlatList
        refreshing={isRefetching}
        onRefresh={refetch}
        data={items}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          if (!item) return null;
          return (
            <Card>
              {item.images[0] && (
                <Card.Cover source={{ uri: item.images[0].url }} />
              )}
              <Card.Title
                title={item.title}
                subtitle={`${item.kind.toUpperCase()} · ${item.place.name}`}
                right={() => (
                  <IconButton
                    icon="bookmark-remove"
                    onPress={() => remove.mutate(item.id)}
                    loading={remove.isPending}
                  />
                )}
              />
              <Card.Content>
                <Text variant="bodySmall">{item.description.slice(0, 120)}</Text>
              </Card.Content>
              <Card.Actions>
                <Link href={`/items/${item.id}`} asChild>
                  <Button>View</Button>
                </Link>
              </Card.Actions>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <Text style={{ textAlign: 'center' }}>
              No bookmarks yet.{'\n'}Save items you want to keep an eye on.
            </Text>
            <Link href="/" asChild>
              <Button mode="contained">Browse feed</Button>
            </Link>
          </View>
        }
      />
    </View>
  );
}
