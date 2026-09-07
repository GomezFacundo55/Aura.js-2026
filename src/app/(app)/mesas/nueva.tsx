import { ErrorBanner } from '@/components/ErrorBanner';
import { fotoCaptura as PhotoCapture } from '@/components/fotoCaptura';
import { mesasServicio } from '@/lib/mesasServicio';
import type { MesaTipo } from '@/types/database';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';


const TIPOS: { label: string; value: MesaTipo }[] = [
  { label: 'VIP', value: 'vip' },
  { label: 'Estándar', value: 'estandar' },
  { label: 'Movilidad reducida', value: 'movilidad_reducida' },
];

export default function NuevaMesaScreen() {
  const [numero, setNumero] = useState('');
  const [comensales, setComensales] = useState('');
  const [tipo, setTipo] = useState<MesaTipo | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [qrGenerado, setQrGenerado] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const validar = async () => {
    const nuevosErrores: Record<string, string> = {};
    const numeroTrim = numero.trim();

    if (!numeroTrim) nuevosErrores.numero = 'El número de mesa es obligatorio';
    else if (!/^\d+$/.test(numeroTrim)) nuevosErrores.numero = 'Debe ser un entero positivo';
    else if (parseInt(numeroTrim, 10) <= 0) nuevosErrores.numero = 'Debe ser mayor a 0';

    const comensalesTrim = comensales.trim();
    if (!comensalesTrim) nuevosErrores.comensales = 'La cantidad de comensales es obligatoria';
    else if (!/^\d+$/.test(comensalesTrim)) nuevosErrores.comensales = 'Debe ser un número entero';
    else {
      const n = parseInt(comensalesTrim, 10);
      if (n <= 0) nuevosErrores.comensales = 'Debe ser mayor a 0';
      else if (n > 20) nuevosErrores.comensales = 'Máximo 20 comensales por mesa';
    }

    if (!tipo) nuevosErrores.tipo = 'Debe seleccionar un tipo de mesa';
    if (!fotoUri) nuevosErrores.foto = 'Debe tomar una foto de la mesa';

    if (!nuevosErrores.numero) {
      const existe = await mesasServicio.existeNumero(parseInt(numeroTrim, 10));
      if (existe) nuevosErrores.numero = 'Ya existe una mesa con ese número';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardar = async () => {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const esValido = await validar();
      if (!esValido) return;

      const mesa = await mesasServicio.crear({
        numero: parseInt(numero, 10),
        comensales: parseInt(comensales, 10),
        tipo: tipo!,
        foto_url: fotoUri!,
      });

      setQrGenerado(mesa.qr_data);
    } catch (e: any) {
      setErrorGeneral(e.message ?? 'No se pudo guardar la mesa');
    } finally {
      setEnviando(false);
    }
  };

  const nuevaMesa = () => {
    setNumero('');
    setComensales('');
    setTipo(null);
    setFotoUri(null);
    setErrores({});
    setQrGenerado(null);
  };

  if (qrGenerado) {
    return (
      <View style={styles.qrScreen}>
        <Text style={styles.title}>Mesa creada correctamente</Text>
        <View style={styles.qrBox}>
          <QRCode value={qrGenerado} size={220} />
        </View>
        <Pressable style={styles.button} onPress={nuevaMesa}>
          <Text style={styles.buttonText}>Agregar otra mesa</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Agregar nueva mesa</Text>
      <ErrorBanner mensaje={errorGeneral} />

      <Text style={styles.label}>Número de mesa</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={numero} onChangeText={setNumero} placeholder="Ej: 12" />
      {errores.numero ? <Text style={styles.error}>{errores.numero}</Text> : null}

      <Text style={styles.label}>Cantidad de comensales</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={comensales} onChangeText={setComensales} placeholder="Ej: 4" />
      {errores.comensales ? <Text style={styles.error}>{errores.comensales}</Text> : null}

      <Text style={styles.label}>Tipo de mesa</Text>
      <View style={styles.tipoRow}>
        {TIPOS.map((t) => (
          <Pressable key={t.value} onPress={() => setTipo(t.value)} style={[styles.tipoChip, tipo === t.value && styles.tipoChipActivo]}>
            <Text style={[styles.tipoChipText, tipo === t.value && styles.tipoChipTextActivo]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {errores.tipo ? <Text style={styles.error}>{errores.tipo}</Text> : null}

      <Text style={styles.label}>Disponibilidad</Text>
      <View style={styles.disponibilidadBox}>
        <Text style={styles.disponibilidadText}>Vacía (por defecto)</Text>
      </View>

      <PhotoCapture uri={fotoUri} onChange={setFotoUri} label="Foto de la mesa" />
      {errores.foto ? <Text style={styles.error}>{errores.foto}</Text> : null}

      <Pressable style={styles.button} onPress={guardar} disabled={enviando}>
        <Text style={styles.buttonText}>{enviando ? 'Guardando...' : 'Guardar mesa'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60 },
  qrScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: '#d33', marginTop: 4, fontSize: 12 },
  tipoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  tipoChipActivo: { backgroundColor: '#222', borderColor: '#222' },
  tipoChipText: { color: '#333' },
  tipoChipTextActivo: { color: '#fff' },
  disponibilidadBox: { backgroundColor: '#eef7ee', padding: 10, borderRadius: 8 },
  disponibilidadText: { color: '#2a7a2a', fontWeight: '600' },
  button: { marginTop: 24, backgroundColor: '#222', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  qrBox: { padding: 20, backgroundColor: '#fff', borderRadius: 16, marginBottom: 24 },
});