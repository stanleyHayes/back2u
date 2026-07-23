import type { ItemImage } from '@back2u/shared-types';

import { api } from './api.js';

async function uploadToCloudinary(file: File, folder: string) {
  const sig = await api.getUploadSignature(folder);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return (await res.json()) as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  };
}

/** Upload a profile avatar and return its secure URL. */
export async function uploadAvatar(file: File): Promise<string> {
  const json = await uploadToCloudinary(file, 'avatars');
  return json.secure_url;
}

export async function uploadImage(file: File): Promise<ItemImage> {
  const sig = await api.getUploadSignature('items');
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const json = (await res.json()) as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  };
  return { url: json.secure_url, publicId: json.public_id, width: json.width, height: json.height };
}
