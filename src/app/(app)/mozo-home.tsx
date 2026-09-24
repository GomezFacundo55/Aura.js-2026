import { useCallback, useRef, useState } from 'react';
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
import { obtenerPedidos, rechazarPedido, confirmarPedido } from '@/servicesJ/pedidoService';
import { EstadoPedido } from '@/interfaces/IPedido';
import { supabase } from '@/lib/supabase';

interface PedidoPendiente {
  id: string;
  mesa_id: string;
  importe_total: number;
  tiempo_estimado_min: number;
  created_at: string;
  estado: EstadoPedido;
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
  const [estadoPedidosObtenido, setEstadoPedidosObtenidos] = useState<EstadoPedido>("pendiente");
  const [entregandoId, setEntregandoId] = useState<string | null>(null);
  const estadoRef = useRef(estadoPedidosObtenido);
  estadoRef.current = estadoPedidosObtenido;

  useFocusEffect(
    useCallback(() => {
      let canalPedido: any = null;

      const inicializarPantalla = async () => {
        await cargarTodo();

        const perfilActual = await getMyProfile();
        if (!perfilActual?.id) return;

        const nombreCanal = `actualizacion-pedidos-mozo-${perfilActual.id}`;

        const canalExistente = supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${nombreCanal}`);

        if (canalExistente) {
          supabase.removeChannel(canalExistente);
        }

        canalPedido = supabase
          .channel(nombreCanal)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "pedidos",
            },
            async (payload) => {
              const nuevoPedido = payload.new as any;
              
              if (nuevoPedido.estado === "pendiente") {
                await SoundService.reproducir("exito"); 
                showToast(
                  "info",
                  "¡Nuevo pedido para confirmar!",
                  "Un cliente hizo un nuevo pedido.",
                );
                if(estadoRef.current === "pendiente"){
                  cargarPedidos("pendiente");
                }
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "pedidos",
            },
            async (payload) => {
              const pedidoActualizado = payload.new as any;
              
              if (pedidoActualizado.estado === "listo") {
                await SoundService.reproducir("exito"); 
                showToast(
                  "info",
                  "¡Pedido listo para entregar!",
                  "El cliente espera su entrega.",
                );
                if(estadoRef.current === "listo"){
                  cargarPedidos("listo");
                }
              }
            }
          )
          .subscribe();
      };

      inicializarPantalla();

      return () => {
        if (canalPedido) {
          supabase.removeChannel(canalPedido);
        }
      };
    }, [])
  );
  

  const cargarTodo = async () => {
    setCargando(true);
    const perfil = await getMyProfile();
    setProfile(perfil);
    await cargarPedidos();
    setCargando(false);
  };

  const cargarPedidos = async (estadoDelPedido: EstadoPedido = "pendiente") => {
    setCargando(true);
    setEstadoPedidosObtenidos(estadoDelPedido);
    const { exito, datos, error } = await obtenerPedidos(estadoDelPedido);
    if (exito && datos) {
      setPedidos(datos as PedidoPendiente[]);
    } else if (error) {
      showToast('error', 'Error', error);
    }
    setCargando(false);
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

  const handleConfirmarRecepcion = async (pedido: PedidoPendiente) => {
  setEntregandoId(pedido.id);
  // ACA TIENE QUE IR LO QUE SE HARA AL PRESIONAR EL BOTON DE ENTREGADO. RECORDATORIO ......
  let exito = true;

  if (exito) {
    await SoundService.reproducir('exito');
    showToast('success', 'Pedido entregado', 'Se marcó la recepción correctamente.');
    await cargarPedidos('listo');
  } else {
    await SoundService.reproducir('error');
    showToast('error', 'Error', 'No se pudo confirmar la recepción.');
  }
  setEntregandoId(null);
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
          onPress={ () => { cargarPedidos(estadoPedidosObtenido) } }
          className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center"
        >
          <Ionicons name="refresh" size={18} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <Text className="text-xl font-bold text-gray-800 px-4 mb-2">
        Pedidos {estadoPedidosObtenido === "pendiente" ? "pendientes de confirmación" : "Listos"}
      </Text>
      <View className="flex-row px-4 mb-3 gap-3">
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={estadoPedidosObtenido === 'pendiente'}
          onPress={() => cargarPedidos('pendiente')}
          className={`flex-1 flex-row py-3 px-4 rounded-xl items-center justify-center border ${
            estadoPedidosObtenido === 'pendiente'
              ? 'bg-orange-200 border-orange-300 opacity-60'
              : 'bg-orange-500 border-orange-600'
          }`}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={estadoPedidosObtenido === 'pendiente' ? '#9A3412' : '#FFFFFF'} 
            style={{ marginRight: 6 }}
          />
          <Text className={`font-semibold text-xs ${
            estadoPedidosObtenido === 'pendiente' ? 'text-amber-900' : 'text-white'
          }`}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={estadoPedidosObtenido === 'listo'}
          onPress={() => cargarPedidos('listo')}
          className={`flex-1 flex-row py-3 px-4 rounded-xl items-center justify-center border ${
            estadoPedidosObtenido === 'listo'
              ? 'bg-orange-200 border-orange-300 opacity-60'
              : 'bg-orange-500 border-orange-600'
          }`}
        >
          <Ionicons 
            name="checkmark-circle-outline" 
            size={18} 
            color={estadoPedidosObtenido === 'listo' ? '#9A3412' : '#FFFFFF'} 
            style={{ marginRight: 6 }}
          />
          <Text className={`font-semibold text-xs ${
            estadoPedidosObtenido === 'listo' ? 'text-amber-900' : 'text-white'
          }`}>
            Listos
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4">
        {pedidos.length === 0 ? (
          <View className="py-20 items-center justify-center bg-white rounded-2xl border border-gray-200 mt-2">
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium text-sm mt-3">
              {estadoPedidosObtenido === 'pendiente' 
                ? 'No hay pedidos pendientes.' 
                : 'No hay pedidos listos.'}
            </Text>
          </View>
        ) : (
          pedidos.map((pedido) => {
            const confirmando = confirmandoId === pedido.id;
            const esListo = estadoPedidosObtenido === 'listo';
            return (
              <View
                key={pedido.id}
                className={`rounded-2xl p-4 mb-3 border border-orange-200 shadow-sm ${
                  esListo 
                    ? 'bg-brand-50 border-brand-200' 
                    : 'bg-orange-100 border-orange-200'
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons 
                      name={esListo ? "checkmark-circle" : "alert-circle"} 
                      size={20} 
                      color={esListo ? "#c97c3d" : "#C2410C"} 
                    />
                    <Text className="font-bold text-gray-900 text-base">
                      Mesa {pedido.mesas?.numero ?? '-'}
                    </Text>
                  </View>

                  <View className={`border px-2.5 py-1 rounded-full flex-row items-center ${
                    esListo ? 'bg-orange-100 border-brand-300' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <Ionicons 
                      name={esListo ? "fast-food-outline" : "time-outline"} 
                      size={13} 
                      color={esListo ? "#d67220" : "#D97706"} 
                    />
                    <Text className={`text-xs font-semibold ml-1 ${
                      esListo ? 'text-orange-800' : 'text-amber-700'
                    }`}>
                      {esListo ? 'Listo para retirar' : `${pedido.tiempo_estimado_min} min aprox.`}
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

                <View className={`h-px my-2 ${esListo ? 'bg-brand-200' : 'bg-orange-200'}`} />

                <View className="flex-row items-center justify-between">
                  <Text className="font-extrabold text-gray-900 text-base">
                    Total: ${pedido.importe_total.toLocaleString('es-AR')}
                  </Text>
                  { pedido.estado == "pendiente" ? (

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={confirmando}
                      onPress={() => abrirModalRechazo(pedido)}
                      className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center gap-1"
                    >
                      <Ionicons name="close-circle-outline" size={14} color="#FFFFFF" />
                      <Text className="text-white font-bold text-xs">Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={confirmando}
                      onPress={() => handleConfirmar(pedido)}
                      className={`px-4 py-2 rounded-xl flex-row items-center gap-1 ${
                        confirmando ? 'bg-orange-100' : 'bg-orange-200'} border border-orange-600`}
                    >
                      {confirmando ? (
                        <ActivityIndicator color="#ffff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#d17529" />
                          <Text className="text-orange-600 font-bold text-xs">Confirmar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  ) : esListo ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={entregandoId === pedido.id}
                      onPress={() => handleConfirmarRecepcion(pedido)}
                      className={`px-4 py-2 rounded-xl flex-row items-center gap-1 ${
                        entregandoId === pedido.id ? 'bg-orange-400' : 'bg-orange-600'
                      } border border-orange-600`}
                    >
                      {entregandoId === pedido.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done-circle-outline" size={14} color="#FFFFFF" />
                          <Text className="text-white font-bold text-xs">Confirmar recepción</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
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