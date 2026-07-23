import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, HelperText, Menu, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

const TARGETS = ['user', 'item', 'message', 'listing'] as const;
const REASONS = ['scam', 'harassment', 'spam', 'inappropriate', 'other'] as const;

export default function SafetyScreen() {
  const qc = useQueryClient();
  const { data: blocks } = useQuery({ queryKey: ['blocks'], queryFn: () => api.listBlocks() });
  const [blockId, setBlockId] = useState('');
  const [report, setReport] = useState({
    target: 'user' as (typeof TARGETS)[number],
    targetId: '',
    reason: 'scam' as (typeof REASONS)[number],
    note: '',
  });
  const [tMenu, setTMenu] = useState(false);
  const [rMenu, setRMenu] = useState(false);

  const block = useMutation({
    mutationFn: () => api.blockUser(blockId),
    onSuccess: () => { setBlockId(''); qc.invalidateQueries({ queryKey: ['blocks'] }); },
  });
  const unblock = useMutation({
    mutationFn: (id: string) => api.unblockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });
  const file = useMutation({ mutationFn: () => api.fileReport(report) });

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text variant="headlineSmall">Safety</Text>
      <Card>
        <Card.Title title="Block a user" />
        <Card.Content>
          <TextInput label="User ID" value={blockId} onChangeText={setBlockId} />
        </Card.Content>
        <Card.Actions><Button onPress={() => block.mutate()} disabled={!blockId} loading={block.isPending}>Block</Button></Card.Actions>
      </Card>
      <Card>
        <Card.Title title="Your blocks" />
        <Card.Content>
          {(!blocks || blocks.length === 0) && <Text>No blocks.</Text>}
          <FlatList
            data={blocks ?? []}
            keyExtractor={(b) => b.blockedId}
            renderItem={({ item: b }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                <Text style={{ flex: 1 }}>{b.blockedId}</Text>
                <Button onPress={() => unblock.mutate(b.blockedId)}>Unblock</Button>
              </View>
            )}
          />
        </Card.Content>
      </Card>
      <Card>
        <Card.Title title="Report content" />
        <Card.Content style={{ gap: 8 }}>
          <Menu
            visible={tMenu}
            onDismiss={() => setTMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setTMenu(true)}>Target: {report.target}</Button>}
          >
            {TARGETS.map((t) => <Menu.Item key={t} onPress={() => { setReport({ ...report, target: t }); setTMenu(false); }} title={t} />)}
          </Menu>
          <TextInput label="Target ID" value={report.targetId} onChangeText={(v) => setReport({ ...report, targetId: v })} />
          <Menu
            visible={rMenu}
            onDismiss={() => setRMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setRMenu(true)}>Reason: {report.reason}</Button>}
          >
            {REASONS.map((r) => <Menu.Item key={r} onPress={() => { setReport({ ...report, reason: r }); setRMenu(false); }} title={r} />)}
          </Menu>
          <TextInput label="Note" value={report.note} onChangeText={(v) => setReport({ ...report, note: v })} multiline />
          {file.isSuccess && <HelperText type="info">Report filed.</HelperText>}
        </Card.Content>
        <Card.Actions><Button mode="contained" onPress={() => file.mutate()} disabled={!report.targetId} loading={file.isPending}>File report</Button></Card.Actions>
      </Card>
    </View>
  );
}
