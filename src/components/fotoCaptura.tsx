import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  uri: string | null;
  onChange: (uri: string) => void;
  size?: number;
  label?: string;
};

export function fotoCaptura({ uri, onChange, size = 220, label = 'Foto' }: Props) {
  const [error, setError] = useState<string | null>(null);

  const tomarFoto = async () => {
    setError(null);
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      setError('Se necesita permiso de cámara para continuar');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!resultado.canceled && resultado.assets?.[0]?.uri) {
      onChange(resultado.assets[0].uri);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.container, { width: size, height: size }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>Sin foto</Text>
        )}
      </View>
      <Pressable style={styles.button} onPress={tomarFoto}>
        <Text style={styles.buttonText}>{uri ? 'Volver a tomar foto' : 'Tomar foto'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#999' },
  button: { marginTop: 10, backgroundColor: '#222', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d33', marginTop: 6, fontSize: 12 },
});