import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile, signOut, type UserProfile } from '@/lib/auth';
import { useToast } from '../../contextJ/Toast';
import { useRouter, useFocusEffect } from 'expo-router';
import { SoundService } from '@/servicesJ/soundService';
import { obtenerPedidosPendientes, rechazarPedido, confirmarPedido } from '@/servicesJ/pedidosServicio';

interface PedidoPendiente {
  id: string;
  mesa_id: string;
  importe_total: number;
  tiempo_estimado_min: number;
  created_at: string;
  mesas: { numero: number } | null;
  pedido_items: {
    id: string;
    nombre_producto: string;
    precio_unitario: number;
    cantidad: number;
  }[];
}

export default function MozoHome() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([]);
  const [pedidoARechazar, setPedidoARechazar] = useState<PedidoPendiente | null>(null);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, []),
  );

  const cargarTodo = async () => {
    setCargando(true);
    const perfil = await getMyProfile();
    setProfile(perfil);
    await cargarPedidos();
    setCargando(false);
  };

  const cargarPedidos = async () => {
    const { exito, datos, error } = await obtenerPedidosPendientes();
    if (exito && datos) {
      setPedidos(datos as PedidoPendiente[]);
    } else if (error) {
      showToast('error', 'Error', error);
    }
  };

  const logOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast('error', 'Error', 'Error al cerrar sesión');
    } else {
      router.replace('/log-in');
    }
  };

  const abrirModalRechazo = (pedido: PedidoPendiente) => {
    setPedidoARechazar(pedido);
    setMotivo('');
  };

  const confirmarRechazo = async () => {
    if (!pedidoARechazar) return;
    if (!motivo.trim()) {
      showToast('error', 'Motivo requerido', 'Indicá por qué se rechaza el pedido.');
      return;
    }

    setEnviando(true);
    const { exito, error } = await rechazarPedido(pedidoARechazar.id, motivo.trim());

    if (exito) {
      await SoundService.reproducir('exito');
      showToast('success', 'Pedido rechazado', 'Se notificó al cliente para que lo modifique.');
      setPedidoARechazar(null);
      setMotivo('');
      await cargarPedidos();
    } else {
      await SoundService.reproducir('error');
      showToast('error', 'Error', error || 'No se pudo rechazar el pedido.');
    }
    setEnviando(false);
  };

  const handleConfirmar = async (pedido: PedidoPendiente) => {
    setConfirmandoId(pedido.id);
    const { exito, error } = await confirmarPedido(pedido.id);

    if (exito) {
      await SoundService.reproducir('exito');
      showToast('success', 'Pedido confirmado', 'Se derivó a cocina y bar.');
      await cargarPedidos();
    } else {
      await SoundService.reproducir('error');
      showToast('error', 'Error', error || 'No se pudo confirmar el pedido.');
    }
    setConfirmandoId(null);
  };

  if (cargando) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={logOut}
            className="w-9 h-9 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm"
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs text-gray-500">Bienvenido/a,</Text>
            <Text className="text-base font-bold text-gray-900">
              {profile ? `${profile.nombres} ${profile.apellidos}` : 'Cargando...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={cargarPedidos}
          className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center"
        >
          <Ionicons name="refresh" size={18} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <Text className="text-xl font-bold text-gray-800 px-4 mb-2">
        Pedidos pendientes de confirmación
      </Text>

      <ScrollView className="flex-1 px-4">
        {pedidos.length === 0 ? (
          <View className="py-20 items-center justify-center bg-white rounded-2xl border border-gray-200 mt-2">
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium text-sm mt-3">
              No hay pedidos pendientes.
            </Text>
          </View>
        ) : (
          pedidos.map((pedido) => {
            const confirmando = confirmandoId === pedido.id;
            return (
              <View
                key={pedido.id}
                className="bg-orange-100 rounded-2xl p-4 mb-3 border border-orange-200 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-gray-900 text-base">
                    Mesa {pedido.mesas?.numero ?? '-'}
                  </Text>
                  <View className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-row items-center">
                    <Ionicons name="time-outline" size={13} color="#D97706" />
                    <Text className="text-amber-700 text-xs font-semibold ml-1">
                      {pedido.tiempo_estimado_min} min aprox.
                    </Text>
                  </View>
                </View>

                {pedido.pedido_items.map((item) => (
                  <View key={item.id} className="flex-row justify-between mb-1">
                    <Text className="text-gray-700 text-xs flex-1" numberOfLines={1}>
                      {item.cantidad}x {item.nombre_producto}
                    </Text>
                    <Text className="text-gray-700 text-xs font-semibold">
                      ${(item.precio_unitario * item.cantidad).toLocaleString('es-AR')}
                    </Text>
                  </View>
                ))}

                <View className="h-px bg-orange-200 my-2" />

                <View className="flex-row items-center justify-between">
                  <Text className="font-extrabold text-gray-900 text-base">
                    Total: ${pedido.importe_total.toLocaleString('es-AR')}
                  </Text>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={confirmando}
                      onPress={() => abrirModalRechazo(pedido)}
                      className="bg-red-500 px-4 py-2 rounded-xl"
                    >
                      <Text className="text-white font-bold text-xs">Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={confirmando}
                      onPress={() => handleConfirmar(pedido)}
                      className={`px-4 py-2 rounded-xl ${confirmando ? 'bg-emerald-300' : 'bg-emerald-600'}`}
                    >
                      {confirmando ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text className="text-white font-bold text-xs">Confirmar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View className="h-6" />
      </ScrollView>

      <Modal visible={!!pedidoARechazar} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-lg font-bold text-gray-900 mb-1">Rechazar pedido</Text>
            <Text className="text-xs text-gray-500 mb-3">
              Mesa {pedidoARechazar?.mesas?.numero ?? '-'}: indicá el motivo para que el
              cliente pueda modificarlo.
            </Text>

            <TextInput
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ej: no hay milanesas disponibles"
              multiline
              className="border border-gray-300 rounded-xl p-3 text-sm text-gray-800 min-h-[80px] mb-4"
              textAlignVertical="top"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPedidoARechazar(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
              >
                <Text className="text-gray-700 font-semibold text-sm">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={enviando}
                onPress={confirmarRechazo}
                className={`flex-1 py-3 rounded-xl items-center ${
                  enviando ? 'bg-red-300' : 'bg-red-500'
                }`}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-bold text-sm">Confirmar rechazo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}