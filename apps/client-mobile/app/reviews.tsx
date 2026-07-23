import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';

import { api } from '../src/lib/api';

function StarRating({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ color: s <= value ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ReviewsScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => api.listReviewsForUser(userId!, 50),
    enabled: !!userId,
  });

  const average = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>
        Reviews
      </Text>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text variant="displaySmall">{average.toFixed(1)}</Text>
          <View>
            <StarRating value={Math.round(average)} />
            <Text variant="bodySmall">{reviews?.length ?? 0} reviews</Text>
          </View>
        </Card.Content>
      </Card>

      <FlatList
        refreshing={isLoading}
        data={reviews ?? []}
        keyExtractor={(r) => r.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: r }) => (
          <Card>
            <Card.Title
              title="Reviewer"
              subtitle={timeAgo(r.createdAt)}
              left={(p) => <Avatar.Text {...p} label="R" />}
            />
            <Card.Content>
              <StarRating value={r.rating} />
              {r.comment && <Text style={{ marginTop: 4 }}>{r.comment}</Text>}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32 }}>No reviews yet.</Text>
        }
      />
    </View>
  );
}
