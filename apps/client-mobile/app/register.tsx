import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth.store';
import { registerForPush } from '../src/lib/push';

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.set);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.register(form);
      setAuth({ user: res.user, accessToken: res.tokens.accessToken, refreshToken: res.tokens.refreshToken });
      void registerForPush().catch(() => {});
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: 'Create account' }} />
      <Text variant="headlineMedium">Create your account</Text>
      <TextInput label="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <TextInput label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
      <TextInput label="Phone (optional)" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
      <TextInput label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      {err && <HelperText type="error">{err}</HelperText>}
      <Button mode="contained" onPress={submit} loading={loading} disabled={!form.name || !form.email || form.password.length < 8}>
        Sign up
      </Button>
      <View />
    </ScrollView>
  );
}
