import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function VerifyPhoneScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const request = useMutation({ mutationFn: () => api.requestPhoneOtp(phone) });
  const verify = useMutation({ mutationFn: () => api.verifyPhoneOtp(phone, code) });
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">Verify phone</Text>
      <TextInput label="Phone (with country code)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button mode="outlined" onPress={() => request.mutate()} disabled={!phone} loading={request.isPending}>Send code</Button>
      {request.isSuccess && <HelperText type="info">OTP sent.</HelperText>}
      <TextInput label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" />
      <Button mode="contained" onPress={() => verify.mutate()} disabled={!code} loading={verify.isPending}>Confirm</Button>
      {verify.isSuccess && <HelperText type="info">Phone verified.</HelperText>}
      {verify.isError && <HelperText type="error">Invalid or expired.</HelperText>}
    </View>
  );
}
