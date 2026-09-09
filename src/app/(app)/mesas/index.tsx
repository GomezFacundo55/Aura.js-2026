import { GradientBackground } from '@/components/ui/GradientBackground';
import { mesasServicio } from '@/lib/mesasServicio';
import type { Mesa, MesaDisponibilidad } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CONFIG_ESTADOS: Record<MesaDisponibilidad, { label: string; bgClass: string; textClass: string; icon: keyof typeof Ionicons.glyphMap }> = {
  vacia: { label: 'Vacía', bgClass: 'bg-emerald-100 border-emerald-200', textClass: 'text-emerald-800', icon: 'checkmark-circle' },
  ocupada: { label: 'Ocupada', bgClass: 'bg-rose-100 border-rose-200', textClass: 'text-rose-800', icon: 'close-circle' },
  reservada: { label: 'Reservada', bgClass: 'bg-amber-100 border-amber-200', textClass: 'text-amber-800', icon: 'time' },
};

const ORDEN_ESTADOS: MesaDisponibilidad[] = ['vacia', 'ocupada', 'reservada'];

export default function ListadoMesasScreen() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(false);
  const insets = useSafeAreaInsets();

  const cargarMesas = useCallback(async () => {
    setCargando(true);
    const data = await mesasServicio.listar();
    setMesas(data);
    setCargando(false);
  }, []);

  useFocusEffect(useCallback(() => { cargarMesas(); }, [cargarMesas]));

  // Alterna al siguiente estado secuencialmente al tocar la píldora
  const rotarEstado = async (mesa: Mesa) => {
    const idxActual = ORDEN_ESTADOS.indexOf(mesa.disponibilidad);
    const siguienteEstado = ORDEN_ESTADOS[(idxActual + 1) % ORDEN_ESTADOS.length];

    await mesasServicio.actualizarDisponibilidad(mesa.id, siguienteEstado);
    setMesas((prev) => prev.map((m) => (m.id === mesa.id ? { ...m, disponibilidad: siguienteEstado } : m)));
  };

  return (
    <View className="flex-1">
      <GradientBackground />

      <FlatList
        className="flex-1"
        numColumns={2}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
        data={mesas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarMesas} tintColor="#FF5A36" />}
        ListHeaderComponent={
          <View className="mb-6 flex-row items-center justify-between border-b border-neutral-400/20 pb-3">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Monitoreo en tiempo real
              </Text>
              <Text className="text-xl font-bold text-neutral-900">
                Listado de Mesas
              </Text>
            </View>
            <View className="rounded-full bg-brand-50 px-3 py-1">
              <Text className="text-xs font-bold text-brand-700">
                {mesas.length} {mesas.length === 1 ? 'Mesa' : 'Mesas'}
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
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
                <Ionicons name="restaurant-outline" size={32} color="#8A8A8F" />
              </View>
              <Text className="text-base font-semibold text-neutral-700">
                No hay mesas cargadas todavía
              </Text>
              <Text className="mt-1 text-center text-xs text-neutral-500">
                Agrega nuevas mesas desde el panel de gestión
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const estadoInfo = CONFIG_ESTADOS[item.disponibilidad] || CONFIG_ESTADOS.vacia;

          return (
            <View className="flex-1 rounded-2xl bg-surface-light p-3 border border-neutral-400/10 shadow-sm justify-between">
              <View>
                {/* Imagen y Número de Mesa */}
                <View className="relative h-28 w-full overflow-hidden rounded-xl bg-surface-muted mb-3">
                  <Image source={{ uri: item.foto_url }} className="h-full w-full" resizeMode="cover" />
                  <View className="absolute top-2 left-2 rounded-md bg-surface-dark/80 px-2.5 py-1 backdrop-blur-md">
                    <Text className="text-xs font-bold text-white">Mesa {item.numero}</Text>
                  </View>
                </View>

                {/* Detalles de la mesa */}
                <View className="mb-3">
                  <Text className="text-sm font-bold text-neutral-900 capitalize">
                    {item.tipo}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Ionicons name="people-outline" size={14} color="#8A8A8F" />
                    <Text className="text-xs text-neutral-500 font-medium">
                      {item.comensales} personas
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botón Píldora de Estado Inteligente (Sin amontonamientos) */}
              <View className="border-t border-neutral-400/10 pt-2.5">
                <Text className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Estado (Tocar p/ cambiar)
                </Text>
                
                <Pressable
                  accessibilityRole="button"
                  onPress={() => rotarEstado(item)}
                  className={`flex-row items-center justify-between px-3 py-2 rounded-xl border active:opacity-80 ${estadoInfo.bgClass}`}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name={estadoInfo.icon} size={15} className={estadoInfo.textClass} />
                    <Text className={`text-xs font-bold ${estadoInfo.textClass}`}>
                      {estadoInfo.label}
                    </Text>
                  </View>
                  <Ionicons name="swap-vertical" size={12} color="#8A8A8F" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}