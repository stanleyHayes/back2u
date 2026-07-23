import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function VerifyEmailScreen() {
  const [code, setCode] = useState('');
  const request = useMutation({ mutationFn: () => api.requestEmailVerification() });
  const confirm = useMutation({ mutationFn: () => api.confirmEmailVerification(code) });
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">Verify email</Text>
      <Button mode="outlined" onPress={() => request.mutate()} loading={request.isPending}>Send code</Button>
      {request.isSuccess && <HelperText type="info">Code sent.</HelperText>}
      <TextInput label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" />
      <Button mode="contained" onPress={() => confirm.mutate()} disabled={!code} loading={confirm.isPending}>Confirm</Button>
      {confirm.isSuccess && <HelperText type="info">Email verified.</HelperText>}
      {confirm.isError && <HelperText type="error">Invalid or expired.</HelperText>}
    </View>
  );
}
