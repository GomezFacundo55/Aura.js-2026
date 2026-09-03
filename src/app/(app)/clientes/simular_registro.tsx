import { fotoCaptura as PhotoCapture } from '@/components/fotoCaptura';
import { clientesService } from '@/lib/clientesServicio';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SimularRegistroScreen() {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const registrar = async () => {
    if (!nombres.trim() || !apellidos.trim() || !fotoUri) return;
    await clientesService.registrar({ nombres, apellidos, foto_url: fotoUri });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simular registro de cliente (solo pruebas)</Text>
      <TextInput style={styles.input} placeholder="Nombres" value={nombres} onChangeText={setNombres} />
      <TextInput style={styles.input} placeholder="Apellidos" value={apellidos} onChangeText={setApellidos} />
      <PhotoCapture uri={fotoUri} onChange={setFotoUri} label="Foto del cliente" />
      <Pressable style={styles.button} onPress={registrar}>
        <Text style={styles.buttonText}>Registrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10 },
  button: { marginTop: 16, backgroundColor: '#222', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});