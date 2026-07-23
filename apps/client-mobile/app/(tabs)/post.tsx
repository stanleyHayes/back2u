import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Button, HelperText, Menu, Text, TextInput } from 'react-native-paper';

import { api } from '../../src/lib/api';

const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'Bag', 'ID', 'Laptop', 'Jewelry', 'Document', 'Other'];

export default function PostScreen() {
  const router = useRouter();
  const [kind, setKind] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Phone');
  const [reward, setReward] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lng: number; lat: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [catMenu, setCatMenu] = useState(false);

  const pickImages = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.7 });
    if (!r.canceled) setPicked(r.assets.map((a) => a.uri).slice(0, 8));
  };

  const useLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return setErr('Location permission denied');
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude, name: 'Current location' });
  };

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      if (!coords) throw new Error('Add a location');
      if (picked.length === 0) throw new Error('Add at least one photo');

      const sig = await api.getUploadSignature('items');
      const images = await Promise.all(
        picked.map(async (uri) => {
          const form = new FormData();
          // @ts-expect-error RN FormData polyfill
          form.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
          form.append('api_key', sig.apiKey);
          form.append('timestamp', String(sig.timestamp));
          form.append('signature', sig.signature);
          form.append('folder', sig.folder);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
          const json = (await res.json()) as { secure_url: string; public_id: string; width: number; height: number };
          return { url: json.secure_url, publicId: json.public_id, width: json.width, height: json.height };
        }),
      );

      const item = await api.createItem({
        kind,
        classification: 'lost',
        title,
        description,
        category,
        images,
        place: { name: coords.name, point: { type: 'Point', coordinates: [coords.lng, coords.lat] } },
        occurredAt: new Date().toISOString(),
        rewardAmount: reward ? Math.round(Number(reward) * 100) : undefined,
      });
      router.push(`/items/${item.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Post a lost or found item</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button mode={kind === 'lost' ? 'contained' : 'outlined'} onPress={() => setKind('lost')}>I lost</Button>
        <Button mode={kind === 'found' ? 'contained' : 'outlined'} onPress={() => setKind('found')}>I found</Button>
      </View>
      <TextInput label="Title" value={title} onChangeText={setTitle} />
      <Menu
        visible={catMenu}
        onDismiss={() => setCatMenu(false)}
        anchor={<Button mode="outlined" onPress={() => setCatMenu(true)}>Category: {category}</Button>}
      >
        {CATEGORIES.map((c) => (
          <Menu.Item key={c} onPress={() => { setCategory(c); setCatMenu(false); }} title={c} />
        ))}
      </Menu>
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
      <TextInput label={`Reward (${DEFAULT_CURRENCY}, optional)`} value={reward} onChangeText={setReward} keyboardType="numeric" />
      <Button mode="outlined" onPress={pickImages}>{picked.length ? `${picked.length} photo(s)` : 'Add photos'}</Button>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {picked.map((u) => (<Image key={u} source={{ uri: u }} style={{ width: 64, height: 64, borderRadius: 8 }} />))}
      </View>
      <Button mode="outlined" onPress={useLocation}>{coords ? `Lat ${coords.lat.toFixed(3)} · Lng ${coords.lng.toFixed(3)}` : 'Use my location'}</Button>
      {err && <HelperText type="error">{err}</HelperText>}
      <Button mode="contained" onPress={submit} loading={submitting} disabled={!title || !description}>Post</Button>
    </ScrollView>
  );
}
