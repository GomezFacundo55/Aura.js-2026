import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
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
import { getMyProfile, signOut, UserProfile } from "@/lib/auth";
import { ConfirmModal } from "@/components/modal";
import type { tabla } from "@/servicesJ/productService";

type Props = {
  tabla: "platos" | "bebidas";
  titulo: string;
};
const PEDIDOS_POR_PAGINA = 2;

export default function PedidosSectorScreen({ tabla, titulo }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoSector[]>([]);
  const [perfilUsuario, setPerfilUsuario] = useState<UserProfile | null>(null);
  const [cargoUsuario, setCargoUsuario] = useState<tabla>('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  const [mensajeModal, setMensajeModal] = useState<string>("");
  const [tituloModal, setTituloModal] = useState<string>("");
  const [actionModal, setActionModal] = useState<boolean>(false);
  const [mostrarModalDos, setMostrarModalDos] = useState(false);

  const totalPaginas = Math.ceil(pedidos.length / PEDIDOS_POR_PAGINA) || 1;
  const indiceInicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
  const pedidosVisibles = pedidos.slice(
    indiceInicio,
    indiceInicio + PEDIDOS_POR_PAGINA,
  );

  useEffect(() => {
      async function loadUserData(){
  
        try {
          const user = await getMyProfile();
          if (user) {
            setPerfilUsuario(user);
            if(user.perfil === "cantinero"){
              setCargoUsuario('bebidas')
            } else if (user.perfil === "cocinero"){
              setCargoUsuario('platos');
            } else{
              showToast("error", "Perfil no admitido.", "Debe ser Cocinero o Bartender.");
              await SoundService.reproducir('error');
              await logOut();
            }
          } else {
            setCargoUsuario("");
            showToast("error", "Error al cargar usuario.", "Redirigiendo al login.");
            await SoundService.reproducir('error');
            await logOut();
          }
        } catch {
          showToast("error", "Error", "Error al cargar el perfil.");
        } finally{
          setCargando(false);
        }
      }
        
      loadUserData();
    }, []);

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    const { exito, datos } = await obtenerPedidosPorSector(tabla);
    if (exito && datos){
      const pedidosFiltrados = datos.filter((pedido) => {
        return !pedido.items.every((item) => item.estado === 'terminado');
      });
      setPedidos(pedidosFiltrados);
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

  const logOut = async()=>{
    const { error } = await signOut();
    if(error){
      showToast("error", "Error", "Error al cerrar sesión")
    } else {
      router.replace("/log-in");
    }
  }
  
  const modalOut = () =>{
    setTituloModal("Salir");
    setMensajeModal("Desea salir?")
    setMostrarModalDos(true);
  }

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
    <View className="flex-1 bg-transparent p-4">
      <View className="flex-row items-center justify-between mt-2 mb-0 bg-orange-500/30 p-2.5 rounded-2xl">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={modalOut}
            className="w-9 h-9 rounded-xl bg-red-400 items-center justify-center mr-3 shadow-sm"
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="w-11 h-11 rounded-full bg-white/40 overflow-hidden items-center justify-center mr-3 border border-white/50">
            {perfilUsuario?.foto_url ? (
              <Image 
                source={{ uri: perfilUsuario.foto_url }} 
                className="w-full h-full"
              />
            ) : (
              <Ionicons name="person" size={22} color="#444" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-dark font-medium text-xs">Bienvenido/a,</Text>
            <Text className="text-dark font-bold text-base" numberOfLines={1}>
              {perfilUsuario ? `${perfilUsuario.nombres} ${perfilUsuario.apellidos}` : "Cargando..."}
            </Text>
          </View>
        </View>

        {cargoUsuario ? (
          <View className="bg-white/20 px-2.5 py-1 rounded-full">
            <Text className="text-dark text-xs font-semibold uppercase tracking-wider">
              {perfilUsuario? `${perfilUsuario.perfil}` : "Cargando..."}
            </Text>
          </View>
        ) : null}
        </View>
      <View className="flex-row items-center justify-between p-2">
        <Text className="text-xl font-bold text-neutral-900">{titulo} </Text>
        <Pressable
          onPress={() => router.push("/(app)/cocinero-home")}
          className="flex-row items-center bg-brand-500 px-3 h-10 rounded-full mr-3 gap-2 active:opacity-85"
        >
          <Ionicons name="create-outline" size={18} color="white" />
          <Text className="text-white font-semibold text-sm">Administrar</Text>
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
      <ConfirmModal
          visible={mostrarModalDos}
          title={tituloModal}
          message={mensajeModal}
          confirmText="Si"
          cancelText="No"
          action={false}
          onConfirm={logOut}
          onCancel={() => {
            setMostrarModalDos(false);
          }}
        />
    </View>
  );
}
