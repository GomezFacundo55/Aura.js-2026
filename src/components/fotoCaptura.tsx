
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

type FotoCapturaProps = {
  label: string;
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  error?: string | null;
};

export function FotoCaptura({
  label,
  photoUri,
  onPhotoChange,
  error,
}: FotoCapturaProps) {
  const [permissionMessage, setPermissionMessage] =
    useState<string | null>(null);

  const handleTakePhoto = async () => {
    setPermissionMessage(null);

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setPermissionMessage(
        'No pudimos acceder a la cámara. Activá el permiso en la configuración del dispositivo para tomar la foto.'
      );
      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (
      !result.canceled &&
      result.assets[0]?.uri
    ) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const displayError =
    error ?? permissionMessage;

  return (
    <View className="w-full">

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={handleTakePhoto}
        className="h-[150px] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-400 bg-orange-50"
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            className="h-full w-full"
            resizeMode="contain"
          />
        ) : (
          <View className="items-center justify-center">

            <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
              <Ionicons
                name="camera-outline"
                size={28}
                color="#FF7A4D"
              />
            </View>

            <Text className="mt-2 text-sm font-bold text-brand-600">
              Tomar foto
            </Text>

            <Text className="mt-1 text-xs text-neutral-600">
              Tocá aquí
            </Text>

          </View>
        )}
      </Pressable>

      {photoUri && (
        <Pressable
          accessibilityRole="button"
          onPress={handleTakePhoto}
          className="mt-1.5 items-center py-1"
        >
          <Text className="text-xs font-semibold text-brand-600">
            Volver a tomar foto
          </Text>
        </Pressable>
      )}

      {displayError && (
        <Text
          accessibilityRole="alert"
          className="mt-1 text-center text-xs font-medium text-danger"
        >
          {displayError}
        </Text>
      )}

    </View>
  );
}

