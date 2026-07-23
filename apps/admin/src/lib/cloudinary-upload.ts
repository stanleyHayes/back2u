import { api } from './api.js';

/** Upload an image file to Cloudinary via a server-signed request; returns its secure URL. */
export async function uploadImageUrl(file: File, folder = 'avatars'): Promise<string> {
  const sig = await api.getUploadSignature(folder);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}
