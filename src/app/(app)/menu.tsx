import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { GradientBackground } from "@/components/ui/GradientBackground";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ProductoCard } from "@/components/menu/ProductoCard";
import { useMenu } from "@/hooks/useMenu";
import { useMesaActual } from "@/hooks/useMesaActual";
import { usePedidoActivo } from "@/hooks/usePedidoActivo";
import { getMyProfile, type UserProfile } from "@/lib/auth";
import { supabase } from "@/servicesJ/supabaseConexion";
import {
  crearPedidoConItems,
  actualizarPedidoConItems,
  confirmarRecepcion,
} from "@/servicesJ/pedidoService";
import type { ItemCarrito } from "@/interfaces/IPedido";
import type { IProductoPedido } from "@/interfaces/IProductoPedido";
import { useToast } from "@/contextJ/Toast";

type CategoriaMenu = "comidas" | "bebidas";
type CarritoMap = Record<string, ItemCarrito>;

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tabSeleccionada, setTabSeleccionada] = useState<CategoriaMenu>("comidas");
  const [numeroMesaFallback, setNumeroMesaFallback] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<CarritoMap>({});
  const [enviando, setEnviando] = useState<boolean>(false);
  const [confirmandoRecepcion, setConfirmandoRecepcion] = useState<boolean>(false);
  const precargado = useRef<boolean>(false);

  const { comidas, bebidas, loading: cargandoMenu, error: errorMenu, recargar } = useMenu();
  const { mesa } = useMesaActual(profile?.id);

  const mesaIdReal = mesa?.id ?? mesaId ?? null;

  const { pedido, loading: cargandoPedido, refetch: refetchPedido } = usePedidoActivo(mesaIdReal);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  useEffect(() => {
    if (!mesa?.numero && mesaId) {
      supabase
        .from("mesas")
        .select("numero")
        .eq("id", mesaId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.numero) {
            setNumeroMesaFallback(data.numero);
          }
        });
    }
  }, [mesa?.numero, mesaId]);

  // Si el pedido fue rechazado, precargamos el carrito con lo que ya tenía
  // para que el cliente lo modifique (punto 13), sólo una vez por rechazo.
  useEffect(() => {
    if (pedido?.estado === "rechazado" && !precargado.current) {
      const nuevoCarrito: CarritoMap = {};
      pedido.pedido_items.forEach((item) => {
        nuevoCarrito[item.producto_id] = {
          producto_id: item.producto_id,
          producto_tabla: item.producto_tabla,
          nombre: item.nombre_producto,
          precio: item.precio_unitario,
          tiempo_elaboracion: 0,
          cantidad: item.cantidad,
        };
      });
      setCarrito(nuevoCarrito);
      precargado.current = true;
    }

    if (!pedido || pedido.estado !== "rechazado") {
      precargado.current = false;
    }
  }, [pedido]);

  const numeroMesa = mesa?.numero ?? numeroMesaFallback ?? (mesaId ? "—" : "");

  const productosActivos = tabSeleccionada === "comidas" ? comidas : bebidas;
  const tablaActual = tabSeleccionada === "comidas" ? "platos" : "bebidas";

  const pedidoBloqueaEdicion =
    pedido?.estado === "pendiente" ||
    pedido?.estado === "confirmado" ||
    pedido?.estado === "en_preparacion" ||
    pedido?.estado === "listo";

  const itemsCarrito = Object.values(carrito);
  const importeTotal = itemsCarrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const tiempoTotalEstimado = itemsCarrito.reduce(
    (acc, i) => Math.max(acc, i.tiempo_elaboracion),
    0
  );
  const cantidadTotalItems = itemsCarrito.reduce((acc, i) => acc + i.cantidad, 0);

  const handleCambiarCantidad = useCallback(
    (producto: IProductoPedido, nuevaCantidad: number) => {
      setCarrito((prev) => {
        const copia = { ...prev };
        if (nuevaCantidad <= 0) {
          delete copia[producto.id];
        } else {
          copia[producto.id] = {
            producto_id: producto.id,
            producto_tabla: tablaActual,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            tiempo_elaboracion: Number(producto.tiempo_elaboracion) || 0,
            cantidad: nuevaCantidad,
          };
        }
        return copia;
      });
    },
    [tablaActual]
  );

  const handleVolver = useCallback(() => {
    if (profile?.perfil === "mozo") {
      router.replace("/(app)/mozo-home");
    } else {
      router.replace("/(app)/home");
    }
  }, [profile?.perfil, router]);

  const handleConfirmarPedido = async () => {
    if (!mesaIdReal || itemsCarrito.length === 0 || enviando) return;

    setEnviando(true);

    const resultado =
      pedido?.estado === "rechazado"
        ? await actualizarPedidoConItems(pedido.id, itemsCarrito)
        : await crearPedidoConItems(mesaIdReal, profile?.id ?? null, itemsCarrito);

    setEnviando(false);

    if (!resultado.exito) {
      showToast("error", "Error", resultado.error || "No se pudo enviar el pedido.");
      return;
    }

    showToast("success", "¡Pedido enviado!", "Esperando confirmación del mozo.");
    setCarrito({});
    precargado.current = false;
    await refetchPedido();
  };

  // Punto 19: el cliente confirma que recibió el pedido completo.
  const handleConfirmarRecepcion = async () => {
    if (!pedido || confirmandoRecepcion) return;

    setConfirmandoRecepcion(true);
    const { exito, error } = await confirmarRecepcion(pedido.id);
    setConfirmandoRecepcion(false);

    if (!exito) {
      showToast("error", "Error", error || "No se pudo confirmar la recepción.");
      return;
    }

    showToast("success", "¡Gracias!", "Ya podés pedir la cuenta cuando quieras.");
    await refetchPedido();
  };

  return (
    <View className="flex-1">
      <GradientBackground />

      <View
        className="flex-1"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <View className="flex-row items-center px-5 mb-4 justify-between">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleVolver}
            className="w-10 h-10 rounded-2xl bg-white/95 items-center justify-center border border-orange-200 shadow-sm"
          >
            <Ionicons name="arrow-back" size={20} color="#FF6B00" />
          </TouchableOpacity>

          <View className="flex-1 mx-3 items-center">
            <Text className="text-3xl font-black text-[#1E2342] text-center" numberOfLines={1}>
              Menú
            </Text>
            {!!numeroMesa && (
              <Text className="text-xs font-bold text-[#8A7B6D]">Mesa {numeroMesa}</Text>
            )}
          </View>

          <View className="w-10" />
        </View>

        {/* Banner de estado del pedido activo */}
        {pedido?.estado === "pendiente" && (
          <View className="mx-5 mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex-row items-center">
            <Ionicons name="hourglass-outline" size={18} color="#D97706" />
            <Text className="ml-2 text-xs font-bold text-amber-700 flex-1">
              Tu pedido está esperando la confirmación del mozo.
            </Text>
          </View>
        )}

        {pedido?.estado === "rechazado" && (
          <View className="mx-5 mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="close-circle-outline" size={18} color="#E11D48" />
              <Text className="ml-2 text-xs font-bold text-rose-700">
                El mozo rechazó tu pedido. Modificalo y reenvialo.
              </Text>
            </View>
            {!!pedido.motivo_rechazo && (
              <Text className="text-[11px] text-rose-600 ml-6">
                Motivo: {pedido.motivo_rechazo}
              </Text>
            )}
          </View>
        )}

        {pedido && ["confirmado", "en_preparacion"].includes(pedido.estado) && (
          <View className="mx-5 mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
              <Text className="ml-2 text-xs font-bold text-emerald-700 flex-1">
                Pedido confirmado. Te avisamos cuando esté listo.
              </Text>
            </View>
          </View>
        )}

        {/* Punto 19: el pedido llegó a la mesa, el cliente confirma la recepción */}
        {pedido?.estado === "listo" && (
          <View className="mx-5 mb-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="fast-food-outline" size={18} color="#059669" />
              <Text className="ml-2 text-xs font-bold text-emerald-700 flex-1">
                ¡Tu pedido está listo! El mozo ya lo está trayendo a tu mesa.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={confirmandoRecepcion}
              onPress={handleConfirmarRecepcion}
              className="py-2.5 rounded-xl flex-row items-center justify-center bg-emerald-600"
            >
              {confirmandoRecepcion ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text className="text-white font-bold text-sm">Confirmar recepción</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-[#FFF4E6] p-1.5 rounded-2xl border border-orange-200 shadow-sm">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTabSeleccionada("comidas")}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                tabSeleccionada === "comidas" ? "bg-[#FF6B00] shadow-sm" : "bg-transparent"
              }`}
            >
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={18}
                color={tabSeleccionada === "comidas" ? "#FFFFFF" : "#8A7B6D"}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`font-bold text-sm ${
                  tabSeleccionada === "comidas" ? "text-white" : "text-[#1E2342]"
                }`}
              >
                Platos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTabSeleccionada("bebidas")}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                tabSeleccionada === "bebidas" ? "bg-[#FF6B00] shadow-sm" : "bg-transparent"
              }`}
            >
              <Ionicons
                name="wine-outline"
                size={18}
                color={tabSeleccionada === "bebidas" ? "#FFFFFF" : "#8A7B6D"}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`font-bold text-sm ${
                  tabSeleccionada === "bebidas" ? "text-white" : "text-[#1E2342]"
                }`}
              >
                Bebidas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {errorMenu && (
          <View className="px-5 mb-2">
            <ErrorBanner mensaje={errorMenu} />
          </View>
        )}

        {cargandoMenu || cargandoPedido ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="mt-3 text-sm font-semibold text-[#8A7B6D]">Cargando...</Text>
          </View>
        ) : (
          <FlatList
            data={productosActivos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductoCard
                producto={item}
                cantidad={carrito[item.id]?.cantidad ?? 0}
                disabled={pedidoBloqueaEdicion}
                onCambiarCantidad={(nuevaCantidad) =>
                  handleCambiarCantidad(item, nuevaCantidad)
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: cantidadTotalItems > 0 || pedidoBloqueaEdicion ? 120 : 40,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl refreshing={cargandoMenu} onRefresh={recargar} tintColor="#FF6B00" />
            }
            ListEmptyComponent={
              <View className="bg-[#FFF4E6] rounded-3xl p-8 items-center justify-center border border-white/60 shadow-sm mt-4">
                <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-3">
                  <Ionicons
                    name={tabSeleccionada === "comidas" ? "restaurant-outline" : "wine-outline"}
                    size={32}
                    color="#FF6B00"
                  />
                </View>
                <Text className="text-lg font-bold text-[#1E2342] text-center mb-1">
                  No hay {tabSeleccionada === "comidas" ? "comidas" : "bebidas"} registradas
                </Text>
                <Text className="text-sm text-[#7A6C5E] text-center">
                  En este momento no hay productos disponibles en esta categoría.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Barra inferior fija: importe acumulado + confirmar (punto 12) */}
      {(cantidadTotalItems > 0 || pedidoBloqueaEdicion) && (
        <View
          className="absolute left-0 right-0 bottom-0 bg-white border-t border-orange-100 px-5 pt-3 shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-[11px] font-bold text-[#8A7B6D] uppercase">
                {cantidadTotalItems} {cantidadTotalItems === 1 ? "producto" : "productos"}
                {tiempoTotalEstimado > 0 ? ` · ~${tiempoTotalEstimado} min` : ""}
              </Text>
              <Text className="text-2xl font-black text-[#1E2342]">
                ${importeTotal.toLocaleString("es-AR")}
              </Text>
            </View>

            {!pedidoBloqueaEdicion && (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={itemsCarrito.length === 0 || enviando}
                onPress={handleConfirmarPedido}
                className={`px-5 py-3 rounded-2xl flex-row items-center ${
                  itemsCarrito.length === 0 || enviando ? "bg-neutral-300" : "bg-[#FF6B00]"
                }`}
              >
                {enviando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-sm">
                      {pedido?.estado === "rechazado" ? "Reenviar pedido" : "Confirmar pedido"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
