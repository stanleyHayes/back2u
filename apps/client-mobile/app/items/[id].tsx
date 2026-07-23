import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { Image, Linking, ScrollView, Share, View } from 'react-native';
import { Button, Chip, HelperText, Text } from 'react-native-paper';

import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth.store';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const { data: item } = useQuery({ queryKey: ['item', id], queryFn: () => api.getItem(id!), enabled: !!id });

  const share = useMutation({
    mutationFn: () => api.getShareCard(id!),
    onSuccess: async (card) => {
      try {
        await Share.share({ message: `${card.message}\n${card.url}`, url: card.url, title: 'Back2u' });
      } catch {
        // User cancelled — no-op.
      }
    },
  });
  const report = useMutation({
    mutationFn: () => api.fileReport({ target: 'item', targetId: id!, reason: 'spam' }),
  });
  const policeReport = useMutation({
    mutationFn: () => api.generateStolenReport(id!),
    onSuccess: (c) => {
      if (c.pdfUrl) void Linking.openURL(c.pdfUrl).catch(() => {});
    },
  });

  if (!item) return null;
  const isOwner = user?.id === item.postedById;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Chip>{item.kind}</Chip>
        <Chip>{item.status}</Chip>
        <Chip>{item.category}</Chip>
        {item.classification === 'stolen' && <Chip>stolen</Chip>}
      </View>
      <Text variant="headlineMedium">{item.title}</Text>
      <Text>{item.description}</Text>
      <Text variant="bodySmall">{item.place.name} · {new Date(item.occurredAt).toLocaleString()}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Button onPress={() => share.mutate()} loading={share.isPending}>Share</Button>
        {!isOwner && user && (
          <Link href={`/verification/${item.id}`} asChild>
            <Button mode="contained">I'm the owner</Button>
          </Link>
        )}
        {isOwner && item.classification === 'stolen' && (
          <Button onPress={() => policeReport.mutate()} loading={policeReport.isPending}>Police report</Button>
        )}
        {!isOwner && user && (
          <Button textColor="red" onPress={() => report.mutate()}>{report.isSuccess ? 'Reported' : 'Report'}</Button>
        )}
      </View>
      {policeReport.isSuccess && policeReport.data.pdfUrl && (
        <Button onPress={() => Linking.openURL(policeReport.data.pdfUrl!)}>Open PDF</Button>
      )}
      {policeReport.isError && <HelperText type="error">Could not generate report.</HelperText>}

      {item.images.map((img) => (
        <Image key={img.publicId} source={{ uri: img.url }} style={{ width: '100%', height: 240, marginTop: 12, borderRadius: 12 }} />
      ))}
    </ScrollView>
  );
}
