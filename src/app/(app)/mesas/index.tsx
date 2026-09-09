import { GradientBackground } from '@/components/ui/GradientBackground';
import { mesasServicio } from '@/lib/mesasServicio';
import type { Mesa, MesaDisponibilidad } from '@/types/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ESTADOS: { label: string; value: MesaDisponibilidad; activeClass: string; textClass: string; borderClass: string }[] = [
  { label: 'Vacía', value: 'vacia', activeClass: 'bg-success', textClass: 'text-success', borderClass: 'border-success' },
  { label: 'Ocupada', value: 'ocupada', activeClass: 'bg-danger', textClass: 'text-danger', borderClass: 'border-danger' },
  { label: 'Reservada', value: 'reservada', activeClass: 'bg-brand-500', textClass: 'text-brand-600', borderClass: 'border-brand-400' },
];

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

  const cambiarDisponibilidad = async (mesa: Mesa, nueva: MesaDisponibilidad) => {
    await mesasServicio.actualizarDisponibilidad(mesa.id, nueva);
    setMesas((prev) => prev.map((m) => (m.id === mesa.id ? { ...m, disponibilidad: nueva } : m)));
  };

  return (
    <View className="flex-1">
      <GradientBackground />
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, gap: 12, flexGrow: 1 }}
        data={mesas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarMesas} />}
        ListHeaderComponent={
          <Text className="mb-4 text-center text-lg font-bold text-neutral-900">
            Listado de mesas
          </Text>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-base text-neutral-700">
              No hay mesas cargadas todavía
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row gap-3 rounded-2xl bg-surface-light p-3">
            <View className="h-20 w-20 overflow-hidden rounded-xl bg-surface-muted">
              <Image source={{ uri: item.foto_url }} className="h-full w-full" resizeMode="cover" />
            </View>
            <View className="flex-1 justify-center gap-1">
              <Text className="text-base font-bold text-neutral-900">Mesa {item.numero}</Text>
              <Text className="text-sm text-neutral-600">
                {item.comensales} comensales · {item.tipo}
              </Text>
              <View className="mt-1 flex-row flex-wrap gap-1.5">
                {ESTADOS.map((e) => {
                  const activo = item.disponibilidad === e.value;
                  return (
                    <Pressable
                      key={e.value}
                      accessibilityRole="button"
                      onPress={() => cambiarDisponibilidad(item, e.value)}
                      className={`rounded-full border px-2.5 py-1 ${e.borderClass} ${activo ? e.activeClass : 'bg-surface-light'}`}
                    >
                      <Text className={`text-xs font-semibold ${activo ? 'text-white' : e.textClass}`}>
                        {e.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}