// servicesJ/storageService.ts
import { supabase } from '@/lib/supabase'
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { tabla } from './productService';



export async function uploadImageToBucket(
  uri: string,
  bucket: tabla
): Promise<string> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  try {
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    const file = new File(uri);

    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function uploadProductImages(
  images: [string, string, string],
  bucket: tabla
): Promise<[string, string, string]> {
  const uploadPromises = images.map((uri) => uploadImageToBucket(uri, bucket));
  const uploadedUrls = await Promise.all(uploadPromises);
  return uploadedUrls as [string, string, string];
}