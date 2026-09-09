import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { clientesService, type Cliente } from '@/lib/clientesServicio';
import { notificarNuevoClientePendiente, pedirPermisosNotificaciones } from '@/lib/notificaciones';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClientesPendientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const insets = useSafeAreaInsets();

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
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const nuevo = payload.new as Cliente & { perfil: string };
          if (nuevo.estado === 'pendiente' && nuevo.perfil === 'cliente_registrado') {
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
    <View className="flex-1">
      <GradientBackground />
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, gap: 12, flexGrow: 1 }}
        data={clientes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarClientes} />}
        ListHeaderComponent={
          <Text className="mb-4 text-center text-lg font-bold text-neutral-900">
            Clientes pendientes de aprobación
          </Text>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-base text-neutral-700">
              No hay clientes pendientes de aprobación
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-4 rounded-2xl bg-surface-light p-3">
            <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-brand-400 bg-surface-muted">
              <Image source={{ uri: item.foto_url }} className="h-full w-full" resizeMode="cover" />
            </View>
            <View className="flex-1 gap-3">
              <Text className="text-base font-bold text-neutral-900">
                {item.apellidos}, {item.nombres}
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button title="Aceptar" className="bg-success" onPress={() => resolver(item, 'aprobado')} />
                </View>
                <View className="flex-1">
                  <Button title="Rechazar" className="bg-danger" onPress={() => resolver(item, 'rechazado')} />
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}