import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

export default function ScanTagScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [message, setMessage] = useState('Hi — I think I have your item.');
  const scan = useMutation({ mutationFn: () => api.scanTag(code!, message) });

  if (!permission)
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading camera…</Text>
      </View>
    );
  if (!permission.granted)
    return (
      <View style={{ padding: 16 }}>
        <Text>We need camera permission to scan QR tags.</Text>
        <Button mode="contained" onPress={requestPermission}>Grant</Button>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {!code ? (
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => setCode(data)}
        />
      ) : (
        <View style={{ padding: 16, gap: 8 }}>
          <Card>
            <Card.Title title="Tag scanned" subtitle={code} />
          </Card>
          <TextInput label="Message to owner" value={message} onChangeText={setMessage} multiline />
          <Button mode="contained" onPress={() => scan.mutate()} loading={scan.isPending}>Notify owner</Button>
          {scan.isSuccess && (
            <HelperText type="info">
              {scan.data.status === 'notified' ? `Owner ${scan.data.ownerName ?? ''} was notified.` : `Status: ${scan.data.status}`}
            </HelperText>
          )}
          <Button onPress={() => setCode(null)}>Scan another</Button>
        </View>
      )}
    </View>
  );
}
