
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
    <View className="w-full items-center gap-1.5">

      <Text
        nativeID="foto-captura-label"
        className="text-sm font-semibold text-neutral-800"
      >
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-labelledby="foto-captura-label"
        className="h-[180px] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-400 bg-surface-light"
        onPress={handleTakePhoto}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            className="h-full w-full"
            resizeMode="contain"
          />
        ) : (
          <View className="items-center gap-2">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-orange-50">
              <Ionicons
                name="camera-outline"
                size={32}
                color="#FF7A4D"
              />
            </View>

            <Text className="text-sm font-bold text-brand-600">
              Tomar foto
            </Text>

            <Text className="text-xs text-neutral-500">
              Tocá para abrir la cámara
            </Text>
          </View>
        )}
      </Pressable>

      {photoUri ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleTakePhoto}
          className="py-1"
        >
          <Text className="text-sm font-semibold text-brand-600">
            Volver a tomar foto
          </Text>
        </Pressable>
      ) : null}

      {displayError ? (
        <Text
          accessibilityRole="alert"
          className="text-center text-sm font-medium text-danger"
        >
          {displayError}
        </Text>
      ) : null}

    </View>
  );
}
