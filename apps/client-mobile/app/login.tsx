import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth.store';
import { registerForPush } from '../src/lib/push';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.set);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const submit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = mfaToken
        ? await api.verifyMfaLogin(mfaToken, code)
        : await api.login({ email, password });
      if ('mfaRequired' in res) {
        setMfaToken(res.mfaToken);
        setCode('');
        return;
      }
      setAuth({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
      void registerForPush().catch(() => {});
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (mfaToken) {
    return (
      <View style={{ padding: 16 }}>
        <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
          Two-factor check
        </Text>
        <Text style={{ marginBottom: 16 }}>
          Enter the 6-digit code from your authenticator app.
        </Text>
        <TextInput
          label="Authentication code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^\d]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoFocus
        />
        {err && <HelperText type="error">{err}</HelperText>}
        <Button
          mode="contained"
          onPress={submit}
          loading={loading}
          disabled={loading || code.length !== 6}
          style={{ marginTop: 16 }}
        >
          Verify & sign in
        </Button>
        <Button
          onPress={() => {
            setMfaToken(null);
            setCode('');
            setErr(null);
          }}
          style={{ marginTop: 8 }}
        >
          Back to password
        </Button>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
        Welcome back
      </Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginTop: 12 }}
      />
      {err && <HelperText type="error">{err}</HelperText>}
      <Button
        mode="contained"
        onPress={submit}
        loading={loading}
        disabled={loading || !email.trim() || !password}
        style={{ marginTop: 16 }}
      >
        Sign in
      </Button>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        <Link href="/register" asChild>
          <Button>Create account</Button>
        </Link>
        <Link href="/forgot-password" asChild>
          <Button>Forgot password?</Button>
        </Link>
      </View>
    </View>
  );
}
