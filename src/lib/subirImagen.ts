import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export async function subirImagen(bucket: string, uriLocal: string, nombreBase: string) {
  const base64 = await FileSystem.readAsStringAsync(uriLocal, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const path = `${nombreBase}-${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}