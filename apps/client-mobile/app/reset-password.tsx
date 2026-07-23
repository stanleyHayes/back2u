import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const requestReset = useMutation({
    mutationFn: () => api.requestPasswordReset(email),
    onSuccess: () => {
      Alert.alert('Check your email', 'We sent you a reset link.');
    },
    onError: (e: unknown) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send reset link');
    },
  });

  const confirmReset = useMutation({
    mutationFn: () => api.confirmPasswordReset(token!, password),
    onSuccess: () => {
      Alert.alert('Password updated', 'You can now sign in with your new password.');
      router.replace('/login');
    },
    onError: (e: unknown) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to reset password');
    },
  });

  // If no token, show forgot-password form
  if (!token) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text variant="headlineSmall">Reset password</Text>
        <Text>Enter your email and we will send you a reset link.</Text>
        <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Button mode="contained" onPress={() => requestReset.mutate()} loading={requestReset.isPending} disabled={!email}>
          Send reset link
        </Button>
        <Button onPress={() => router.push('/login')}>Back to sign in</Button>
      </ScrollView>
    );
  }

  const mismatch = password && confirm && password !== confirm;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">New password</Text>
      <TextInput label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {mismatch && <HelperText type="error">Passwords do not match</HelperText>}
      <Button
        mode="contained"
        onPress={() => confirmReset.mutate()}
        loading={confirmReset.isPending}
        disabled={!password || password !== confirm}
      >
        Update password
      </Button>
    </ScrollView>
  );
}
