import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { useToast } from "../../contextJ/Toast";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/modal";
import { obtenerListaDeEspera, eliminarEspera } from "@/servicesJ/listaDeEsperaService";
import { SoundService } from "@/servicesJ/soundService";
import { IListaDeEspera } from "@/interfaces/IlistaEspara";
import { supabase } from "@/lib/supabase";

export default function App() {
  const [perfilUsuario, setPerfilUsuario] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  const router = useRouter();
  const [listaDeEspera, setListaDeEspera] = useState<IListaDeEspera[]>([]);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [cargoUsuario, setCargoUsuario] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const elementosPorPagina = 3;
  const totalPaginas =
    Math.ceil(listaDeEspera.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const elementosPaginados = listaDeEspera.slice(
    indiceInicio,
    indiceInicio + elementosPorPagina,
  );

  useEffect(() => {
    inicializar();
    const canalEspera = supabase
      .channel('cambios-lista-espera')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lista_espera' },
        async (payload) => {
          console.log('Nuevo cliente en lista de espera:', payload.new);
          showToast('info', "Aviso", "Nuevo cliente en lista de espera.")
          await SoundService.reproducir('info'); 
          cargarListaDeEspera();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalEspera);
    };
  }, []);

  const inicializar = async () => {
    setCargando(true);
    await loadUserData();
    await cargarListaDeEspera();
    setCargando(false);
  };

  async function loadUserData() {
    try {
      const user = await getMyProfile();
      if (user) {
        setPerfilUsuario(user);
        setCargoUsuario(user.perfil);
      } else {
        setCargoUsuario("");
        showToast(
          "error",
          "Error al cargar usuario.",
          "Redirigiendo al login.",
        );
        await SoundService.reproducir("error");
        await logOut();
      }
    } catch {
      showToast("error", "Error", "Error al cargar el perfil.");
    } finally {
      setCargando(false);
    }
  }

  const cargarListaDeEspera = async () => {
    const { exito, datos, error } = await obtenerListaDeEspera();
    if (error) {
      showToast("error", "Error al cargar la lista de espera.", error);
      await SoundService.reproducir("error");
    }
    if (exito && datos) {
      setListaDeEspera(datos);
    }
  };
  const logOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast("error", "Error", "Error al cerrar sesión");
    } else {
      router.replace("/log-in");
    }
  };

  const handleAsignarMesa = (item: IListaDeEspera) => {
    console.log("Asignar mesa al turno:", item.id);
    router.push({pathname: "/(app)/lista_mesas",
      params: {id: item.id, estado: item.estado}
    });
  };

  const handleEliminarCliente = async (item: IListaDeEspera) => {
    const { error } = await eliminarEspera(item.id);
    if(error){
      showToast('error', "Error", error);
      await SoundService.reproducir("error");
    } else {
      showToast("success", "Listo.", "Eliminado con exito.");
      await SoundService.reproducir("exito");
      await cargarListaDeEspera();
    }

  };

  return (
    <View className="flex-1 p-4">
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between mt-2 mb-2 bg-[#FFE8D1] p-3 rounded-2xl border border-orange-200">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMostrarModal(true)}
            className="w-10 h-10 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm"
          >
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-neutral-500 font-medium text-xs">
              Bienvenido/a,
            </Text>
            <Text
              className="text-neutral-900 font-bold text-base"
              numberOfLines={1}
            >
              {perfilUsuario
                ? `${perfilUsuario.nombres} ${perfilUsuario.apellidos}`
                : "Cargando..."}
            </Text>
          </View>
        </View>

        {cargoUsuario && (
          <View className="bg-[#FF6B00] px-3 py-1 rounded-full shadow-sm">
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              {perfilUsuario ? perfilUsuario.perfil : ""}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between mb-2 px-1">
        <View>
          <Text className="text-xl font-black text-neutral-900">
            Lista de Espera
          </Text>
        </View>
      </View>

      {cargando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <View className="flex-1">
          {elementosPaginados.map((item, index) => {
            const numeroTurno = indiceInicio + index + 1;
            const tieneMesa = item.estado === "asignado";

            return (
              <View
                key={item.id}
                className="bg-orange-100/50 rounded-3xl p-2 mb-3 border border-neutral-200 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-2">
                      <Text className="text-xs font-black text-[#FF6B00]">
                        #{numeroTurno}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-neutral-900">
                        Cliente en cola
                      </Text>
                      <Text className="text-[10px] text-neutral-400">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Reciente"}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`flex-row items-center px-2.5 py-1 rounded-full border ${
                      tieneMesa
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <View
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        tieneMesa ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <Text
                      className={`text-[11px] font-bold ${
                        tieneMesa ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {tieneMesa ? "Mesa Asignada" : "En Espera"}
                    </Text>
                  </View>
                </View>

                <View className="bg-orange-50 rounded-2xl p-2.5 mb-3 flex-row items-center">
                  <MaterialCommunityIcons
                    name="table-chair"
                    size={20}
                    color={tieneMesa ? "#10B981" : "#9CA3AF"}
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-xs text-neutral-600 font-medium">
                    {tieneMesa
                      ? `Asignado a mesa activa`
                      : "Sin mesa designada."}
                  </Text>
                </View>

                <View className="flex-row items-center space-x-2 pt-1">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={tieneMesa}
                    onPress={() => handleAsignarMesa(item)}
                    className="flex-1 bg-[#FF6B00] py-2.5 rounded-xl flex-row items-center justify-center shadow-sm mr-2"
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text className="text-white font-bold text-xs">
                      {tieneMesa ? "Cambiar mesa" : "Asignar mesa"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleEliminarCliente(item)}
                    className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={17} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
     
      {!cargando && listaDeEspera.length > 0 && (
        <View className="flex-row items-center justify-between py-1 mt-1">
          <TouchableOpacity
            disabled={paginaActual === 1}
            onPress={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
              paginaActual === 1
                ? "bg-neutral-200 border-neutral-300 opacity-50"
                : "bg-white border-neutral-300 shadow-sm"
            }`}
          >
            <Ionicons name="chevron-back" size={14} color="#374151" />
            <Text className="text-xs font-bold text-neutral-700 ml-1">
              Anterior
            </Text>
          </TouchableOpacity>

          <Text className="text-xs font-semibold text-neutral-600">
            Página {paginaActual} de {totalPaginas}
          </Text>

          <TouchableOpacity
            disabled={paginaActual >= totalPaginas}
            onPress={() =>
              setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
            }
            className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
              paginaActual >= totalPaginas
                ? "bg-neutral-200 border-neutral-300 opacity-50"
                : "bg-white border-neutral-300 shadow-sm"
            }`}
          >
            <Text className="text-xs font-bold text-neutral-700 mr-1">
              Siguiente
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={mostrarModal}
        title="Confirmar acción."
        message="¿Desea salir?"
        confirmText="Sí"
        cancelText="No"
        action={false}
        onConfirm={logOut}
        onCancel={() => setMostrarModal(false)}
      />
    </View>
  );
}