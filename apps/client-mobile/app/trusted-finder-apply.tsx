import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth.store';

async function uploadImageMobile(uri: string): Promise<string> {
  const sig = await api.getUploadSignature('trusted-finder');
  const form = new FormData();
  // @ts-expect-error React Native FormData accepts uri objects
  form.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
  const res = await fetch(url, { method: 'POST', body: form as never });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}

export default function TrustedFinderApplyScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: applications } = useQuery({
    queryKey: ['trusted-finder-apps'],
    queryFn: () => api.listTrustedFinderApplications(),
    enabled: !!user,
  });

  const apply = useMutation({
    mutationFn: () => api.applyTrustedFinder({ idPhotoUrl: photoUrl!, bio: bio || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trusted-finder-apps'] });
      Alert.alert('Application submitted', 'We will review your application shortly.');
      setBio('');
      setPhotoUrl(null);
    },
    onError: (e: unknown) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit');
    },
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const url = await uploadImageMobile(result.assets[0].uri);
      setPhotoUrl(url);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  if (user.trustedFinder) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text variant="headlineSmall">Trusted Finder</Text>
        <Card style={{ backgroundColor: '#ECFDF5' }}>
          <Card.Content>
            <Text style={{ color: '#065F46' }}>
              You are a verified Trusted Finder. Thank you for helping reunite people with their belongings.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  const latest = applications?.[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Apply as Trusted Finder</Text>

      {latest?.status === 'pending' && (
        <Card style={{ backgroundColor: '#FFFBEB' }}>
          <Card.Content>
            <Text style={{ color: '#92400E' }}>
              Your application is pending review. We will notify you once a decision is made.
            </Text>
          </Card.Content>
        </Card>
      )}

      {latest?.status === 'rejected' && (
        <Card style={{ backgroundColor: '#FEF2F2' }}>
          <Card.Content>
            <Text style={{ color: '#991B1B' }}>
              Your application was rejected{latest.reason ? `: ${latest.reason}` : '.'}
            </Text>
          </Card.Content>
        </Card>
      )}

      <TextInput
        label="Bio (optional)"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
      />

      <Button mode="outlined" onPress={pickPhoto} loading={uploading}>
        {photoUrl ? 'Change ID photo' : 'Upload ID photo'}
      </Button>
      {photoUrl && (
        <Text variant="bodySmall" style={{ color: '#065F46' }}>
          Photo uploaded
        </Text>
      )}

      <Button
        mode="contained"
        onPress={() => apply.mutate()}
        loading={apply.isPending}
        disabled={!photoUrl || latest?.status === 'pending'}
      >
        Submit application
      </Button>
    </ScrollView>
  );
}
