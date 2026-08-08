import type { Locale, MomoProvider } from '@back2u/shared-types';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { Button, Card, HelperText, Menu, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth.store';

const WEB_URL = (process.env.EXPO_PUBLIC_WEBSITE_URL as string | undefined) ?? 'https://bak2me.com';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tw', label: 'Twi' },
  { code: 'ga', label: 'Ga' },
  { code: 'ee', label: 'Ewe' },
];

const MOMO_PROVIDERS: { code: MomoProvider; label: string }[] = [
  { code: 'MTN', label: 'MTN MoMo' },
  { code: 'VOD', label: 'Telecel Cash' },
  { code: 'ATL', label: 'AirtelTigo Money' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, clear } = useAuth();
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'en');
  const [localeMenu, setLocaleMenu] = useState(false);
  const [redeem, setRedeem] = useState('0');
  const [momoProvider, setMomoProvider] = useState<MomoProvider | undefined>(user?.momoProvider);
  const [momoNumber, setMomoNumber] = useState(user?.momoNumber ?? '');
  const [momoMenu, setMomoMenu] = useState(false);

  const setLoc = useMutation({ mutationFn: () => api.setLocale(locale) });
  const redeemMut = useMutation({ mutationFn: () => api.redeemPoints(Number(redeem)) });
  const payoutMut = useMutation({
    mutationFn: () => api.updateProfile({ momoProvider, momoNumber: momoNumber.trim() }),
    onSuccess: (updated) => {
      const { accessToken, refreshToken } = useAuth.getState();
      if (accessToken && refreshToken) {
        useAuth.getState().set({ user: updated, accessToken, refreshToken });
      }
    },
  });
  const exportMut = useMutation({ mutationFn: () => api.exportAccount() });
  const deleteMut = useMutation({
    mutationFn: () => api.deleteAccount(),
    onSuccess: () => {
      clear();
      router.replace('/login');
    },
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
              <Menu.Item
                key={l.code}
                onPress={() => {
                  setLocale(l.code);
                  setLocaleMenu(false);
                }}
                title={l.label}
              />
            ))}
          </Menu>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setLoc.mutate()} loading={setLoc.isPending}>
            Save
          </Button>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Identity" />
        <Card.Actions>
          <Link href="/verify-email" asChild>
            <Button>Verify email</Button>
          </Link>
          <Link href="/verify-phone" asChild>
            <Button>Verify phone</Button>
          </Link>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Redeem points" subtitle={`Balance: ${user?.pointsBalance ?? 0}`} />
        <Card.Content>
          <TextInput
            label="Points"
            value={redeem}
            onChangeText={setRedeem}
            keyboardType="numeric"
          />
          {redeemMut.isSuccess && (
            <HelperText type="info">Balance: {redeemMut.data.pointsBalance}</HelperText>
          )}
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => redeemMut.mutate()} loading={redeemMut.isPending}>
            Redeem
          </Button>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title
          title="Reward payout"
          subtitle="Mobile money account we send released rewards to"
        />
        <Card.Content style={{ gap: 8 }}>
          <Menu
            visible={momoMenu}
            onDismiss={() => setMomoMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMomoMenu(true)}>
                {MOMO_PROVIDERS.find((p) => p.code === momoProvider)?.label ?? 'Select provider'}
              </Button>
            }
          >
            {MOMO_PROVIDERS.map((p) => (
              <Menu.Item
                key={p.code}
                onPress={() => {
                  setMomoProvider(p.code);
                  setMomoMenu(false);
                }}
                title={p.label}
              />
            ))}
          </Menu>
          <TextInput
            label="Mobile money number"
            value={momoNumber}
            onChangeText={setMomoNumber}
            keyboardType="phone-pad"
            placeholder="233…"
          />
          {payoutMut.isSuccess && <HelperText type="info">Payout details saved.</HelperText>}
          {payoutMut.isError && (
            <HelperText type="error">Could not save. Please try again.</HelperText>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => payoutMut.mutate()}
            loading={payoutMut.isPending}
            disabled={!momoProvider || momoNumber.trim().length < 6}
          >
            Save payout details
          </Button>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Privacy & data" />
        <Card.Content>
          <HelperText type="info">
            Export a copy of your data, or permanently delete your account. Deleting is
            irreversible.
          </HelperText>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => exportMut.mutate()} loading={exportMut.isPending}>
            Export data
          </Button>
          <Button textColor="red" onPress={confirmDelete} loading={deleteMut.isPending}>
            Delete account
          </Button>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Legal" />
        <Card.Actions>
          <Button onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}>Privacy Policy</Button>
          <Button onPress={() => Linking.openURL(`${WEB_URL}/terms`)}>Terms of Service</Button>
        </Card.Actions>
      </Card>

      <View style={{ height: 16 }} />
      <Button
        onPress={() => {
          clear();
          router.replace('/login');
        }}
      >
        Sign out
      </Button>
    </ScrollView>
  );
}
