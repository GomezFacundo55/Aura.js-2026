import { IPickImageOptions } from "@/interfaces/IPickImageOptios";
import * as ImagePicker from "expo-image-picker"

export async function pickImageHelper({
  source,
  aspect = [4, 3],
  quality = 0.7,
  allowsEditing = true,
}: IPickImageOptions): Promise<string | null> {
  try {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('PERMISSION_DENIED_CAMERA');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        return result.assets[0].uri;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('PERMISSION_DENIED_GALLERY');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        return result.assets[0].uri;
      }
    }

    return null;
  } catch (error: any) {
    throw error;
  }
}