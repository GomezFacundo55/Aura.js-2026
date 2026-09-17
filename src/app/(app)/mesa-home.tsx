import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../contextJ/Toast';
import { SoundService } from '@/servicesJ/soundService';
import { obtenerProductos } from '@/servicesJ/productService';
import {
  crearPedidoConItems,
  actualizarPedidoConItems,
  obtenerPedidoActivoPorMesa,
} from '@/servicesJ/pedidoService';
import { supabase } from '@/servicesJ/supabaseConexion';
import { ItemCarrito, Pedido, PedidoConItems } from '@/interfaces/IPedido';

interface ProductoMenu {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_elaboracion: number;
  fotos: string[];
  tabla: 'platos' | 'bebidas';
}

export default function MesaHome() {
  const { mesaId, cliente_id } = useLocalSearchParams<{
    mesaId: string;
    cliente_id?: string;
  }>();
  const { showToast } = useToast();

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [productos, setProductos] = useState<ProductoMenu[]>([]);
  const [carrito, setCarrito] = useState<Record<string, ItemCarrito>>({});
  const [pedido, setPedido] = useState<PedidoConItems | null>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!mesaId) return;

    const canal = supabase
      .channel(`pedido-mesa-${mesaId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `mesa_id=eq.${mesaId}`,
        },
        async (payload) => {
          const actualizado = payload.new as Pedido;

          if (actualizado.estado === 'rechazado') {
            await SoundService.reproducir('error');
            showToast(
              'error',
              'Tu pedido fue rechazado',
              actualizado.motivo_rechazo || 'El mozo te pide que lo modifiques.',
            );

            const { exito, datos } = await obtenerPedidoActivoPorMesa(mesaId);
            if (exito && datos) {
              setPedido(datos);
              precargarCarritoDesdePedido(datos);
            }
          } else {
            setPedido((prev) => (prev ? { ...prev, ...actualizado } : (actualizado as PedidoConItems)));
            await SoundService.reproducir('exito');
            showToast('success', 'Pedido confirmado', 'Tu pedido fue enviado a cocina/bar.');
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [mesaId]);

  const precargarCarritoDesdePedido = (datos: PedidoConItems) => {
    setCarrito((prevProductos) => {
      const nuevo: Record<string, ItemCarrito> = {};
      datos.pedido_items.forEach((it) => {
        const prod = productos.find((p) => p.id === it.producto_id);
        nuevo[it.producto_id] = {
          producto_id: it.producto_id,
          producto_tabla: it.producto_tabla,
          nombre: it.nombre_producto,
          precio: it.precio_unitario,
          tiempo_elaboracion: prod?.tiempo_elaboracion || 0,
          cantidad: it.cantidad,
        };
      });
      return nuevo;
    });
  };

  const init = async () => {
    setCargando(true);
    try {
      const [platosRes, bebidasRes] = await Promise.all([
        obtenerProductos('platos'),
        obtenerProductos('bebidas'),
      ]);

      const platos: ProductoMenu[] = (platosRes.datos || []).map((p: any) => ({
        ...p,
        tabla: 'platos' as const,
      }));
      const bebidas: ProductoMenu[] = (bebidasRes.datos || []).map((p: any) => ({
        ...p,
        tabla: 'bebidas' as const,
      }));
      const productosCargados = [...platos, ...bebidas];
      setProductos(productosCargados);

      if (mesaId) {
        const { exito, datos } = await obtenerPedidoActivoPorMesa(mesaId);
        if (exito && datos) {
          setPedido(datos);
          if (datos.estado === 'rechazado') {
            const nuevoCarrito: Record<string, ItemCarrito> = {};
            datos.pedido_items.forEach((it) => {
              const prod = productosCargados.find((p) => p.id === it.producto_id);
              nuevoCarrito[it.producto_id] = {
                producto_id: it.producto_id,
                producto_tabla: it.producto_tabla,
                nombre: it.nombre_producto,
                precio: it.precio_unitario,
                tiempo_elaboracion: prod?.tiempo_elaboracion || 0,
                cantidad: it.cantidad,
              };
            });
            setCarrito(nuevoCarrito);
          }
        }
      }
    } catch (err) {
      showToast('error', 'Error', 'No se pudo cargar el menú.');
      await SoundService.reproducir('error');
    } finally {
      setCargando(false);
    }
  };

  const agregarAlCarrito = (producto: ProductoMenu) => {
    setCarrito((prev) => {
      const actual = prev[producto.id];
      return {
        ...prev,
        [producto.id]: {
          producto_id: producto.id,
          producto_tabla: producto.tabla,
          nombre: producto.nombre,
          precio: producto.precio,
          tiempo_elaboracion: producto.tiempo_elaboracion,
          cantidad: (actual?.cantidad || 0) + 1,
        },
      };
    });
  };

  const quitarDelCarrito = (productoId: string) => {
    setCarrito((prev) => {
      const actual = prev[productoId];
      if (!actual) return prev;
      if (actual.cantidad <= 1) {
        const { [productoId]: _eliminado, ...resto } = prev;
        return resto;
      }
      return { ...prev, [productoId]: { ...actual, cantidad: actual.cantidad - 1 } };
    });
  };

  const itemsCarrito = Object.values(carrito);
  const importeTotal = itemsCarrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const tiempoEstimado = itemsCarrito.reduce((acc, i) => Math.max(acc, i.tiempo_elaboracion), 0);

  const confirmarPedido = async () => {
    if (itemsCarrito.length === 0) {
      showToast('error', 'Carrito vacío', 'Agregá al menos un producto antes de continuar.');
      return;
    }
    if (!mesaId) return;

    setEnviando(true);
    const { exito, datos, error } = await crearPedidoConItems(
      mesaId,
      cliente_id || null,
      itemsCarrito,
    );

    if (exito && datos) {
      await SoundService.reproducir('exito');
      showToast('success', 'Pedido enviado', 'Esperando la confirmación del mozo.');
      setPedido({ ...datos, pedido_items: [] });
    } else {
      await SoundService.reproducir('error');
      showToast('error', 'Error', error || 'No se pudo enviar el pedido.');
    }
    setEnviando(false);
  };

  const reenviarPedido = async () => {
    if (!pedido) return;
    if (itemsCarrito.length === 0) {
      showToast('error', 'Carrito vacío', 'Agregá al menos un producto antes de reenviar.');
      return;
    }

    setEnviando(true);
    const { exito, datos, error } = await actualizarPedidoConItems(pedido.id, itemsCarrito);

    if (exito && datos) {
      await SoundService.reproducir('exito');
      showToast('success', 'Pedido reenviado', 'Esperando la confirmación del mozo.');
      setPedido({ ...datos, pedido_items: [] });
    } else {
      await SoundService.reproducir('error');
      showToast('error', 'Error', error || 'No se pudo reenviar el pedido.');
    }
    setEnviando(false);
  };

  if (cargando) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#EA580C" />
        <Text className="text-gray-500 font-medium text-xs mt-3">Cargando menú...</Text>
      </View>
    );
  }

  // Pedido ya confirmado por el mozo (o en curso en cocina/bar): pantalla de solo estado.
  if (pedido && pedido.estado !== 'pendiente' && pedido.estado !== 'rechazado') {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="restaurant-outline" size={48} color="#EA580C" />
        <Text className="text-lg font-bold text-gray-900 mt-3 text-center">
          Tu pedido está {pedido.estado === 'confirmado' ? 'confirmado' : pedido.estado}
        </Text>
        <Text className="text-gray-500 text-xs text-center mt-1">
          Te vamos a avisar cuando haya novedades.
        </Text>
      </View>
    );
  }

  // Pedido pendiente de confirmación del mozo: no se puede editar todavía.
  if (pedido && pedido.estado === 'pendiente' && itemsCarrito.length > 0 && !pedido.motivo_rechazo) {
    // Nota: si el usuario está reenviando, este bloque no debe tapar el carrito.
  }

  const esperandoConfirmacion = pedido?.estado === 'pendiente';

  if (esperandoConfirmacion) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator size="large" color="#EA580C" />
        <Text className="text-lg font-bold text-gray-900 mt-4 text-center">
          Esperando la confirmación del mozo
        </Text>
        <Text className="text-gray-500 text-xs text-center mt-1">
          Importe: ${importeTotal.toLocaleString('es-AR')} · {tiempoEstimado} min aprox.
        </Text>
      </View>
    );
  }

  const estaEditandoRechazado = pedido?.estado === 'rechazado';

  return (
    <View className="flex-1">
      <View className="p-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Menú</Text>
        {estaEditandoRechazado && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
            <Text className="text-red-700 font-bold text-xs">Pedido rechazado</Text>
            <Text className="text-red-600 text-xs mt-0.5">
              {pedido?.motivo_rechazo || 'Modificá tu pedido y reenvialo.'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-4">
        {productos.map((producto) => {
          const cantidad = carrito[producto.id]?.cantidad || 0;
          return (
            <View
              key={producto.id}
              className="bg-orange-100 rounded-2xl p-3.5 mb-3 border border-orange-200 shadow-sm flex-row"
            >
              <View className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 self-center">
                <Image
                  source={{ uri: producto.fotos?.[0] }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <View className="flex-1 ml-3.5 justify-between">
                <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>
                  {producto.nombre}
                </Text>
                <Text className="text-gray-500 text-xs" numberOfLines={2}>
                  {producto.descripcion}
                </Text>

                <View className="flex-row items-center justify-between mt-1.5">
                  <Text className="font-extrabold text-gray-900 text-sm">
                    ${producto.precio.toLocaleString('es-AR')}
                  </Text>

                  <View className="flex-row items-center bg-white rounded-xl border border-orange-200">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => quitarDelCarrito(producto.id)}
                      disabled={cantidad === 0}
                      className="w-8 h-8 items-center justify-center"
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={cantidad === 0 ? '#D1D5DB' : '#EA580C'}
                      />
                    </TouchableOpacity>
                    <Text className="w-6 text-center font-bold text-sm text-gray-800">
                      {cantidad}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => agregarAlCarrito(producto)}
                      className="w-8 h-8 items-center justify-center"
                    >
                      <Ionicons name="add" size={16} color="#EA580C" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
        <View className="h-24" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
              Total
            </Text>
            <Text className="text-2xl font-black text-gray-900">
              ${importeTotal.toLocaleString('es-AR')}
            </Text>
          </View>
          <View className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-row items-center">
            <Ionicons name="time-outline" size={13} color="#D97706" />
            <Text className="text-amber-700 text-xs font-semibold ml-1">
              {tiempoEstimado} min aprox.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={enviando || itemsCarrito.length === 0}
          onPress={estaEditandoRechazado ? reenviarPedido : confirmarPedido}
          className={`py-3.5 rounded-xl items-center ${
            enviando || itemsCarrito.length === 0 ? 'bg-orange-200' : 'bg-orange-500'
          }`}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">
              {estaEditandoRechazado ? 'Reenviar pedido' : 'Confirmar pedido'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
