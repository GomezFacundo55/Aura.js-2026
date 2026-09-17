import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { obtenerPedidosPorSector, type PedidoSector } from '@/servicesJ/pedidosSectorService';
import { notificarNuevoPedido } from '@/lib/notificaciones';

type Props = {
  tabla: 'platos' | 'bebidas';
  titulo: string;
};

export default function PedidosSectorScreen({ tabla, titulo }: Props) {
  const [pedidos, setPedidos] = useState<PedidoSector[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    const { exito, datos } = await obtenerPedidosPorSector(tabla);
    if (exito && datos) setPedidos(datos);
    setCargando(false);
  }, [tabla]);

  useFocusEffect(useCallback(() => { cargarPedidos(); }, [cargarPedidos]));

  useEffect(() => {
    const canal = supabase
      .channel(`pedidos-${tabla}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: 'estado=eq.confirmado' },
        () => {
          cargarPedidos();
          notificarNuevoPedido(`Nuevo pedido confirmado para ${titulo.toLowerCase()}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tabla, titulo, cargarPedidos]);

  const formatearHora = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-muted">
        <ActivityIndicator size="large" color="#FF5A36" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface-muted" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text className="text-xl font-bold text-neutral-900">{titulo}</Text>

      {pedidos.length === 0 ? (
        <View className="items-center justify-center rounded-2xl bg-surface-light py-16">
          <Ionicons name="checkmark-done-circle-outline" size={48} color="#8A8A8F" />
          <Text className="mt-3 text-sm font-medium text-neutral-500">
            No hay pedidos pendientes de preparación.
          </Text>
        </View>
      ) : (
        pedidos.map((pedido) => (
          <View key={pedido.id} className="rounded-2xl bg-surface-light p-4 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-neutral-900">
                Mesa {pedido.mesas?.numero ?? '-'}
              </Text>
              <View className="flex-row items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1">
                <Ionicons name="time-outline" size={13} color="#FF5A36" />
                <Text className="text-xs font-semibold text-brand-700">
                  {formatearHora(pedido.created_at)}
                </Text>
              </View>
            </View>

            <View className="gap-1">
              {pedido.items.map((item) => (
                <Text key={item.id} className="text-sm text-neutral-700">
                  {item.cantidad}x {item.nombre_producto}
                </Text>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}