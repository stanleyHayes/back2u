import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth.store';

export default function ChatScreen() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const { data: threads } = useQuery({ queryKey: ['threads'], queryFn: () => api.listThreads() });
  const [active, setActive] = useState<string | null>(null);
  const { data: messages } = useQuery({
    queryKey: ['messages', active],
    queryFn: () => api.getMessages(active!),
    enabled: !!active,
    refetchInterval: 3000,
  });
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => { if (!active && threads?.[0]) setActive(threads[0].id); }, [threads, active]);

  if (!active) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No conversations yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ padding: 12, gap: 8 }}
        data={messages ?? []}
        keyExtractor={(m) => m.id}
        renderItem={({ item: m }) => (
          <Card style={{ alignSelf: m.authorId === user?.id ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <Card.Content>
              <Text>{m.body}</Text>
            </Card.Content>
          </Card>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 8, padding: 8 }}>
        <TextInput style={{ flex: 1 }} placeholder="Message…" value={draft} onChangeText={setDraft} dense />
        <Button
          mode="contained"
          onPress={async () => {
            const body = draft.trim();
            if (!body) return;
            setSendError(null);
            setDraft('');
            try {
              await api.sendMessage({ threadId: active, body });
              qc.invalidateQueries({ queryKey: ['messages', active] });
            } catch {
              setDraft(body);
              setSendError('Message failed to send — try again.');
            }
          }}
        >
          Send
        </Button>
      </View>
      {sendError && (
        <Text style={{ color: '#B91C1C', paddingHorizontal: 12, paddingBottom: 8 }}>{sendError}</Text>
      )}
    </View>
  );
}
