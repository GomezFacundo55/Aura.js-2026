import { clientesService } from '@/lib/clientesServicio';
import { notificarNuevoClientePendiente, pedirPermisosNotificaciones } from '@/lib/notificaciones';
import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/types/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function ClientesPendientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    const data = await clientesService.listarPendientes();
    setClientes(data);
    setCargando(false);
  }, []);

  useFocusEffect(useCallback(() => { cargarClientes(); }, [cargarClientes]));

  useEffect(() => {
    pedirPermisosNotificaciones();

    const canal = supabase
      .channel('clientes-pendientes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clientes' },
        (payload) => {
          const nuevo = payload.new as Cliente;
          if (nuevo.estado === 'pendiente') {
            setClientes((prev) => [...prev, nuevo]);
            notificarNuevoClientePendiente(`${nuevo.nombres} ${nuevo.apellidos}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const resolver = async (cliente: Cliente, estado: 'aprobado' | 'rechazado') => {
    await clientesService.resolver(cliente.id, estado);
    setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
  };

  return (
    <FlatList
      contentContainerStyle={styles.lista}
      data={clientes}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarClientes} />}
      ListEmptyComponent={<Text style={styles.vacio}>No hay clientes pendientes de aprobación</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.fotoContainer}>
            <Image source={{ uri: item.foto_url }} style={styles.foto} resizeMode="cover" />
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre}>{item.apellidos}, {item.nombres}</Text>
            <View style={styles.botonesRow}>
              <Pressable style={[styles.boton, styles.botonAceptar]} onPress={() => resolver(item, 'aprobado')}>
                <Text style={styles.botonTexto}>Aceptar</Text>
              </Pressable>
              <Pressable style={[styles.boton, styles.botonRechazar]} onPress={() => resolver(item, 'rechazado')}>
                <Text style={styles.botonTexto}>Rechazar</Text>
              </Pressable>
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
  card: { flexDirection: 'row', gap: 14, backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
  fotoContainer: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', backgroundColor: '#eee' },
  foto: { width: '100%', height: '100%' },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  botonesRow: { flexDirection: 'row', gap: 10 },
  boton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  botonAceptar: { backgroundColor: '#2a7a2a' },
  botonRechazar: { backgroundColor: '#b33' },
  botonTexto: { color: '#fff', fontWeight: '700' },
});