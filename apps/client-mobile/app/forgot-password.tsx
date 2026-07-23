import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const reset = useMutation({ mutationFn: () => api.requestPasswordReset(email) });
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">Reset password</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Button mode="contained" onPress={() => reset.mutate()} disabled={!email || reset.isPending} loading={reset.isPending}>
        Send reset link
      </Button>
      {reset.isSuccess && <HelperText type="info">If that email exists, a reset link is on the way.</HelperText>}
    </View>
  );
}
