import { GradientBackground } from '@/components/ui/GradientBackground';
import { clientesService, type Cliente } from '@/lib/clientesServicio';
import { supabase } from '@/lib/supabase';
import { enviarMailCliente } from '@/servicesJ/emailService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClientesPendientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    const data = await clientesService.listarPendientes();
    setClientes(data);
    setCargando(false);
  }, []);

  useFocusEffect(useCallback(() => { cargarClientes(); }, [cargarClientes]));

  useEffect(() => {
    //pedirPermisosNotificaciones();

    const canal = supabase
      .channel('clientes-pendientes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const nuevo = payload.new as Cliente & { perfil: string };
          if (nuevo.estado === 'pendiente' && nuevo.perfil === 'cliente_registrado') {
            setClientes((prev) => [...prev, nuevo]);
            //notificarNuevoClientePendiente(`${nuevo.nombres} ${nuevo.apellidos}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const resolver = async (cliente: Cliente, estado: 'aprobado' | 'rechazado') => {
    setProcesandoId(cliente.id);
    try {
      await clientesService.resolver(cliente.id, estado);
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id));

      const clienteExt = cliente as Cliente & { dni?: string; mail?: string; email?: string };
      const correo = clienteExt.email || clienteExt.mail;

      if (!correo) {
        console.warn('El cliente no tiene email cargado, no se envía mail.');
        return;
      }

      const { error } = await enviarMailCliente({
        email: correo,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        estado,
      });

      if (error) {
        console.warn('No se pudo enviar el mail al cliente:', error);
      }
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <View className="flex-1">
      <GradientBackground />

      <FlatList
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
          gap: 12,
        }}
        data={clientes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarClientes} tintColor="#FF5A36" />}
        ListHeaderComponent={
          <View className="mb-2 flex-row items-center justify-between border-b border-neutral-400/20 pb-3">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Aprobación de Usuarios
              </Text>
              <Text className="text-xl font-bold text-neutral-900">
                Clientes Pendientes
              </Text>
            </View>
            <View className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1">
              <Text className="text-xs font-bold text-amber-800">
                {clientes.length} {clientes.length === 1 ? 'Pendiente' : 'Pendientes'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#FF5A36" />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
                <Ionicons name="checkmark-done" size={32} color="#059669" />
              </View>
              <Text className="text-base font-semibold text-neutral-700">
                ¡Todo al día!
              </Text>
              <Text className="mt-1 text-center text-xs text-neutral-500">
                No hay registros pendientes de aprobación por el momento
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const estaProcesando = procesandoId === item.id;
          const clienteExt = item as Cliente & { dni?: string; mail?: string; email?: string };
          const correo = clienteExt.email || clienteExt.mail;

          return (
            <View className="rounded-2xl bg-surface-light p-4 border border-neutral-400/10 shadow-sm gap-3">
              {/* Encabezado e Información del Cliente */}
              <View className="flex-row items-center gap-3">
                <View className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-brand-400 bg-surface-muted">
                  <Image source={{ uri: item.foto_url }} className="h-full w-full" resizeMode="cover" />
                </View>

                <View className="flex-1 justify-center">
                  <Text className="text-base font-bold text-neutral-900 leading-snug">
                    {item.nombres} {item.apellidos}
                  </Text>

                  {clienteExt.dni && (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Ionicons name="card-outline" size={13} color="#8A8A8F" />
                      <Text className="text-xs text-neutral-500 font-medium">
                        DNI: {clienteExt.dni}
                      </Text>
                    </View>
                  )}

                  {correo && (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Ionicons name="mail-outline" size={13} color="#8A8A8F" />
                      <Text className="text-xs text-neutral-500" numberOfLines={1}>
                        {correo}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Botones de Acción */}
              <View className="flex-row gap-2 border-t border-neutral-400/10 pt-3">
                <Pressable
                  disabled={estaProcesando}
                  accessibilityRole="button"
                  onPress={() => resolver(item, 'aprobado')}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 active:bg-emerald-700 active:scale-[0.98]"
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Aprobar</Text>
                </Pressable>

                <Pressable
                  disabled={estaProcesando}
                  accessibilityRole="button"
                  onPress={() => resolver(item, 'rechazado')}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 active:bg-rose-700 active:scale-[0.98]"
                >
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Rechazar</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}