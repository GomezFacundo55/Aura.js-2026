import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

type AvatarCaptureProps = {
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  error?: string | null;
};

export function AvatarCapture({ photoUri, onPhotoChange, error }: AvatarCaptureProps) {
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    setPermissionMessage(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setPermissionMessage(
        "No pudimos acceder a la cámara. Activá el permiso en la configuración del dispositivo para tomar tu foto.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const displayError = error ?? permissionMessage;

  return (
    <View className="items-center gap-3">
      <Text nativeID="guest-photo-label" className="self-start text-sm font-medium text-neutral-700">
        Foto de perfil
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tomar foto de perfil"
        aria-labelledby="guest-photo-label"
        className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-brand-400 bg-surface-light"
        onPress={handleTakePhoto}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} className="h-full w-full" />
        ) : (
          <Text className="px-2 text-center text-sm text-neutral-500">Tocá para{"\n"}tomar foto</Text>
        )}
      </Pressable>

      {displayError ? (
        <Text accessibilityRole="alert" className="text-center text-sm text-danger">
          {displayError}
        </Text>
      ) : null}
    </View>
  );
}
