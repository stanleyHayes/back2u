import type { Locale } from '@back2u/shared-types';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, HelperText, Menu, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth.store';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tw', label: 'Twi' },
  { code: 'ga', label: 'Ga' },
  { code: 'ee', label: 'Ewe' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, clear } = useAuth();
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'en');
  const [localeMenu, setLocaleMenu] = useState(false);
  const [redeem, setRedeem] = useState('0');

  const setLoc = useMutation({ mutationFn: () => api.setLocale(locale) });
  const redeemMut = useMutation({ mutationFn: () => api.redeemPoints(Number(redeem)) });
  const exportMut = useMutation({ mutationFn: () => api.exportAccount() });
  const deleteMut = useMutation({
    mutationFn: () => api.deleteAccount(),
    onSuccess: () => { clear(); router.replace('/login'); },
    onError: () =>
      Alert.alert('Could not delete account', 'Something went wrong. Please try again.'),
  });

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently anonymises your account and cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate() },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Text variant="headlineSmall">Settings</Text>

      <Card>
        <Card.Title title="Language" />
        <Card.Content>
          <Menu
            visible={localeMenu}
            onDismiss={() => setLocaleMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setLocaleMenu(true)}>
                {LOCALES.find((l) => l.code === locale)?.label}
              </Button>
            }
          >
            {LOCALES.map((l) => (
              <Menu.Item key={l.code} onPress={() => { setLocale(l.code); setLocaleMenu(false); }} title={l.label} />
            ))}
          </Menu>
        </Card.Content>
        <Card.Actions><Button onPress={() => setLoc.mutate()} loading={setLoc.isPending}>Save</Button></Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Identity" />
        <Card.Actions>
          <Link href="/verify-email" asChild><Button>Verify email</Button></Link>
          <Link href="/verify-phone" asChild><Button>Verify phone</Button></Link>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Redeem points" subtitle={`Balance: ${user?.pointsBalance ?? 0}`} />
        <Card.Content>
          <TextInput label="Points" value={redeem} onChangeText={setRedeem} keyboardType="numeric" />
          {redeemMut.isSuccess && <HelperText type="info">Balance: {redeemMut.data.pointsBalance}</HelperText>}
        </Card.Content>
        <Card.Actions><Button mode="contained" onPress={() => redeemMut.mutate()} loading={redeemMut.isPending}>Redeem</Button></Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Privacy" />
        <Card.Actions>
          <Button onPress={() => exportMut.mutate()} loading={exportMut.isPending}>Export data</Button>
          <Button textColor="red" onPress={confirmDelete} loading={deleteMut.isPending}>Delete account</Button>
        </Card.Actions>
      </Card>

      <View style={{ height: 16 }} />
      <Button onPress={() => { clear(); router.replace('/login'); }}>Sign out</Button>
    </ScrollView>
  );
}
