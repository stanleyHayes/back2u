import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, IconButton, List, Text } from 'react-native-paper';

import type { NotificationDTO } from '@back2u/shared-types';
import { api } from '../src/lib/api';

const TYPE_ICONS: Record<NotificationDTO['type'], string> = {
  match: 'tag',
  message: 'chat',
  courier: 'truck-delivery',
  marketplace: 'shopping',
  tag: 'qrcode',
  system: 'cog',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(50),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const onPress = (n: NotificationDTO) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.url) {
      router.push(n.url as never);
    } else if (n.data?.itemId) {
      router.push(`/items/${n.data.itemId}` as never);
    } else if (n.data?.threadId) {
      router.push('/(tabs)/chat' as never);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        <Text variant="headlineSmall">Notifications</Text>
        <Button onPress={() => markAll.mutate()} loading={markAll.isPending}>
          Mark all read
        </Button>
      </View>
      <FlatList
        refreshing={isRefetching}
        onRefresh={refetch}
        data={data ?? []}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />}
        renderItem={({ item: n }) => (
          <List.Item
            title={n.title}
            description={n.body}
            titleStyle={{ fontWeight: n.read ? 'normal' : 'bold' }}
            left={() => (
              <List.Icon
                icon={TYPE_ICONS[n.type] as never}
                color={n.read ? '#9CA3AF' : '#0F766E'}
              />
            )}
            right={() => <Text variant="bodySmall">{timeAgo(n.createdAt)}</Text>}
            onPress={() => onPress(n)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40 }}>
            No notifications yet.
          </Text>
        }
      />
    </View>
  );
}
