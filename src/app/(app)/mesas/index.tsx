import { mesasServicio } from '@/lib/mesasServicio';
import type { Mesa, MesaDisponibilidad } from '@/types/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

const ESTADOS: { label: string; value: MesaDisponibilidad; color: string }[] = [
  { label: 'Vacía', value: 'vacia', color: '#2a7a2a' },
  { label: 'Ocupada', value: 'ocupada', color: '#b33' },
  { label: 'Reservada', value: 'reservada', color: '#b38f00' },
];

export default function ListadoMesasScreen() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarMesas = useCallback(async () => {
    setCargando(true);
    const data = await mesasServicio.listar();
    setMesas(data);
    setCargando(false);
  }, []);

  useFocusEffect(useCallback(() => { cargarMesas(); }, [cargarMesas]));

  const cambiarDisponibilidad = async (mesa: Mesa, nueva: MesaDisponibilidad) => {
    await mesasServicio.actualizarDisponibilidad(mesa.id, nueva);
    setMesas((prev) => prev.map((m) => (m.id === mesa.id ? { ...m, disponibilidad: nueva } : m)));
  };

  return (
    <FlatList
      contentContainerStyle={styles.lista}
      data={mesas}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarMesas} />}
      ListEmptyComponent={<Text style={styles.vacio}>No hay mesas cargadas todavía</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.fotoContainer}>
            <Image source={{ uri: item.foto_url }} style={styles.foto} resizeMode="cover" />
          </View>
          <View style={styles.info}>
            <Text style={styles.numero}>Mesa {item.numero}</Text>
            <Text style={styles.detalle}>{item.comensales} comensales · {item.tipo}</Text>
            <View style={styles.estadosRow}>
              {ESTADOS.map((e) => (
                <Pressable
                  key={e.value}
                  onPress={() => cambiarDisponibilidad(item, e.value)}
                  style={[styles.estadoChip, { borderColor: e.color }, item.disponibilidad === e.value && { backgroundColor: e.color }]}
                >
                  <Text style={[styles.estadoText, item.disponibilidad === e.value && { color: '#fff' }]}>{e.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16 },
  vacio: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 12 },
  fotoContainer: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' },
  foto: { width: '100%', height: '100%' },
  info: { flex: 1 },
  numero: { fontSize: 16, fontWeight: '700' },
  detalle: { color: '#666', marginTop: 2, marginBottom: 8 },
  estadosRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  estadoChip: { borderWidth: 1, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 10 },
  estadoText: { fontSize: 12, fontWeight: '600' },
});