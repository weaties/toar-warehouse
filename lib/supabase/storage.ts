import { supabase } from './client';
import * as FileSystem from 'expo-file-system';

const BUCKET = 'pet-photos';

export async function uploadPhoto(
  localUri: string,
  petId: string,
): Promise<string> {
  const filename = `${petId}/${Date.now()}.jpg`;

  // Read the file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, byteArray, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function uploadFormScanPhoto(
  localUri: string,
  petId: string,
): Promise<string> {
  const filename = `form-scans/${petId}/${Date.now()}.jpg`;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, byteArray, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function deletePhoto(url: string): Promise<void> {
  // Extract path from URL: .../storage/v1/object/public/pet-photos/PATH
  const match = url.match(/pet-photos\/(.+)$/);
  if (!match) return;

  const { error } = await supabase.storage.from(BUCKET).remove([match[1]]);
  if (error) throw error;
}
