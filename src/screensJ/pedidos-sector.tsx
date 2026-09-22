import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  obtenerPedidosPorSector,
   comenzarSector, terminarSector,
  type PedidoSector,
} from "@/servicesJ/pedidosSectorService";
import { notificarNuevoPedido } from "@/lib/notificaciones";
import { useToast } from '../contextJ/Toast';
import { SoundService } from '../servicesJ/soundService';

type Props = {
  tabla: "platos" | "bebidas";
  titulo: string;
};
const PEDIDOS_POR_PAGINA = 2;

export default function PedidosSectorScreen({ tabla, titulo }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoSector[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  const totalPaginas = Math.ceil(pedidos.length / PEDIDOS_POR_PAGINA) || 1;
  const indiceInicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
  const pedidosVisibles = pedidos.slice(
    indiceInicio,
    indiceInicio + PEDIDOS_POR_PAGINA,
  );

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    const { exito, datos } = await obtenerPedidosPorSector(tabla);
    if (exito && datos){
      setPedidos(datos);
      showToast("success", "Exito.", "Pedidos cargados exitosamente.");
      await SoundService.reproducir("exito");
    } else{
      showToast("error", "Error", "Erros al cargar pedidos.");
      await SoundService.reproducir('error');
    }
    setCargando(false);
    setPaginaActual(1);
  }, [tabla]);

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
    }, [cargarPedidos]),
  );

  useEffect(() => {
    const nombreCanal = `pedidos-${tabla}`;

    const canalExistente = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${nombreCanal}`);

    if (canalExistente) {
      supabase.removeChannel(canalExistente);
    }
    const canal = supabase
      .channel(nombreCanal)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: "estado=eq.confirmado",
        },
        () => {
          cargarPedidos();
          notificarNuevoPedido(
            `Nuevo pedido confirmado para ${titulo.toLowerCase()}`,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tabla, titulo, cargarPedidos]);

  const formatearHora = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const manejarComenzar = async (idPedido: string) => {
    const { exito, error } = await comenzarSector(idPedido, tabla);
    if(exito) {
      cargarPedidos();
    } else {
      showToast("error", "Error al empezar con el pedido.", error);
      await SoundService.reproducir('error');
    }
  };

  const manejarTerminar = async (idPedido: string) => {
    const { exito, error } = await terminarSector(idPedido, tabla);

    if (!exito) {
      showToast("error", "Error", "Ocurrio un error al terminar con el pedido.");
      await SoundService.reproducir('error');
    }
    cargarPedidos();
  };

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator size="large" color="#FF5A36" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-transparent"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[30px] font-bold text-neutral-900">{titulo}</Text>
        <Pressable
          onPress={() => router.replace("/(app)/dashboard")}
          className="w-10 h-10 rounded-full bg-brand-500 items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </Pressable>
      </View>

      {pedidos.length === 0 ? (
        <View className="items-center justify-center rounded-2xl bg-transparent py-16">
          <Ionicons
            name="checkmark-done-circle-outline"
            size={48}
            color="#8A8A8F"
          />
          <Text className="mt-3 text-sm font-medium text-neutral-500">
            No hay pedidos pendientes de preparación.
          </Text>
        </View>
      ) : (
        <>
          {pedidosVisibles.map((pedido: PedidoSector) => {
            let enProceso = true;
            return (
              <View
                key={pedido.id}
                className="rounded-2xl bg-brand-200 border-2 border-brand-500 p-4 gap-2 mb-3"
              >
                <View className="flex-row items-center justify-between border-b border-brand-300 pb-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[20px] font-bold text-neutral-900">
                      Mesa {pedido.mesas?.numero ?? "-"}
                    </Text>
                  </View>
                  <View className="bg-red-100 border border-brand-200 px-2 py-0.5 rounded-full flex-row items-center">
                    <Ionicons name="time-outline" size={12} color="#D97706" />
                    <Text className="text-amber-700 text-[11px] font-medium ml-1">
                      {formatearHora(pedido.created_at)}
                    </Text>
                  </View>
                </View>

                <View className="gap-1.5 py-1">
                  {pedido.items.map((item) => { 
                    if(item.estado == "pendiente"){
                      enProceso = false;
                    }
                    return(
                      <Text
                        key={item.id}
                        className="text-[18px] font-medium text-neutral-800"
                      >
                        {item.cantidad}x {item.nombre_producto}
                      </Text>
                    )}
                  )}
                </View>

                <View className="flex-row justify-end gap-3 mt-2 pt-2 border-t border-brand-300">
                  {!enProceso ? (
                    <Pressable
                      onPress={() => manejarComenzar(pedido.id)}
                      className="flex-row items-center bg-brand-100 border border-brand-500 px-4 py-2.5 rounded-xl gap-2 active:opacity-80"
                    >
                      <Ionicons name="play-outline" size={18} color="red" />
                      <Text className="text-brand-500 font-bold text-base">
                        Comenzar
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => manejarTerminar(pedido.id)}
                      className="flex-row items-center bg-brand-600 px-4 py-2.5 rounded-xl gap-2 active:opacity-80"
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="white"
                      />
                      <Text className="text-white font-bold text-base">
                        Terminar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {pedidos.length > PEDIDOS_POR_PAGINA && (
            <View className="flex-row items-center justify-between bg-orange-500/30 px-4 py-2.5 rounded-2xl mt-1 mb-2">
              <TouchableOpacity
                disabled={paginaActual === 1}
                onPress={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                className={`w-9 h-9 rounded-xl items-center justify-center ${
                  paginaActual === 1 ? "bg-white/10" : "bg-white/40"
                }`}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={paginaActual === 1 ? "#9CA3AF" : "#FFFFFF"}
                />
              </TouchableOpacity>

              <Text className="text-neutral-900 font-bold text-sm">
                Página {paginaActual} de {totalPaginas}
              </Text>

              <TouchableOpacity
                disabled={paginaActual === totalPaginas}
                onPress={() =>
                  setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
                }
                className={`w-9 h-9 rounded-xl items-center justify-center ${
                  paginaActual === totalPaginas ? "bg-white/10" : "bg-white/40"
                }`}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={paginaActual === totalPaginas ? "#9CA3AF" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
