import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text, Image, ActivityIndicator, ScrollView } from "react-native";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { useToast } from "../../contextJ/Toast";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SoundService } from "@/servicesJ/soundService";
import QrScannerModal from "@/components/ui/QRScanner";
import { ConfirmModal } from "@/components/modal";
import { useMesaActual } from "@/hooks/useMesaActual";
import { crearUnaEspera, consultarClienteEnListaDeEspera, vincularClienteAMesa } from "@/servicesJ/listaDeEsperaService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type ScanMode = "ingreso" | "mesa";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  const router = useRouter();
  const [cargando, setCargando] = useState<boolean>(true);

  const [qrEscaneado, setQrEscaneado] = useState<boolean>(false);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>("ingreso");

  const [enListaDeEspera, setEnListaDeEspera] = useState<boolean>(false);
  const [esperaId, setEsperaId] = useState<string | null>(null);
  const [mesaHabilitada, setMesaHabilitada] = useState<boolean>(false);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  

  // NUEVO: distingue "el metre ya me asignó mesa (DB)" de "ya escaneé el QR físico de esa mesa"
  const { mesa, tieneMesa, mesaVinculada, refetch } = useMesaActual(profile?.id);

  const keyIngreso = (clienteId: string) => `ingreso_${clienteId}`;

  const QR_INGRESO = "INGRESO_LOCAL";

  // Determina en qué paso del flujo está el cliente
  const paso: "ingreso" | "espera" | "escanear_mesa" | "vinculado" =
    !qrEscaneado ? "ingreso" : !tieneMesa ? "espera" : !mesaVinculada ? "escanear_mesa" : "vinculado";

  const esCasoA = paso === "ingreso";
  const esCasoB = paso === "espera";

  useFocusEffect(
    useCallback(() => {
      let canalEspera: any = null;

      const inicializarPantalla = async () => {
        await cargaDatosIniciales();
        
        const perfilActual = await getMyProfile();
        if (!perfilActual?.id) return;

        const nombreCanal = `espera-cliente-${perfilActual.id}`;

        const canalExistente = supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${nombreCanal}`);
        
        if (canalExistente) {
          supabase.removeChannel(canalExistente);
        }

        canalEspera = supabase
          .channel(nombreCanal)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "lista_espera",
              filter: `cliente_id=eq.${perfilActual.id}`,
            },
            async (payload) => {
              const registroActualizado = payload.new as any;

              if (
                registroActualizado.estado === "asignado" &&
                registroActualizado.mesa_asignada_id
              ) {
                setMesaHabilitada(true);
                await SoundService.reproducir("exito");
                showToast(
                  "success",
                  "¡Mesa asignada!",
                  "El metre te asignó una mesa. Ya podés ingresar.",
                );
                await refetch();
              }
            }
          )
          .subscribe();
      };

      inicializarPantalla();

      return () => {
        if (canalEspera) {
          supabase.removeChannel(canalEspera);
        }
      };
    }, [])
  );

  useEffect(() => {
    if (tieneMesa && !qrEscaneado) {
      setQrEscaneado(true);
    }
  }, [tieneMesa, qrEscaneado]);

  const cargaDatosIniciales = async () => {
    try {
      const perfil = await getMyProfile();
      if (!perfil) {
        router.replace("/log-in");
        return;
      }
      setProfile(perfil);

      if (perfil?.id) {
        const [{ exito, datos }, ingresoGuardado] = await Promise.all([
          consultarClienteEnListaDeEspera(perfil.id),
          AsyncStorage.getItem(keyIngreso(perfil.id)),
        ]);

        if (exito && datos) {
          if(datos.estado == "asignado" || "vinculado"){
            setMesaHabilitada(true);
          }
          setQrEscaneado(true);
          setEnListaDeEspera(true);
          setEsperaId(datos.id);
        } else if (ingresoGuardado !== null) {
          setQrEscaneado(true);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudo cargar la información inicial");
    } finally {
      setCargando(false);
    }
  };

  const onScanPress = () => {
    // La card de escaneo se reutiliza: decide el modo según el paso actual
    setScanMode(paso === "escanear_mesa" ? "mesa" : "ingreso");
    setScannerVisible(true);
  };

  const onEncuestasPress = () => {
    if (!qrEscaneado) return;
    // TODO: navegar a la pantalla de encuestas
  };

  const onListaEsperaPress = async () => {
    if (!qrEscaneado || profile === null || mesaHabilitada === true) return;
    const { exito, datos, error } = await crearUnaEspera(profile.id);
    if (error || !datos) {
      showToast("error", "Error al unirse a la lista de espera", error || "No se pudo registrar");
      SoundService.reproducir("error");
    } else {
      setEnListaDeEspera(true);
      setEsperaId(datos.id);
      SoundService.reproducir("exito");
      showToast("success", "¡Listo!", "Usted se añadió a la lista de espera.");
    }
  };

  const handleIngresoQr = async (data: string) => {
    let esValido = false;
    try {
      const parsed = JSON.parse(data);
      if (parsed.tipo === QR_INGRESO) esValido = true;
    } catch {
      if (data.trim().toUpperCase() === QR_INGRESO) esValido = true;
    }

    if (esValido) {
      setQrEscaneado(true);
      if (profile) {
        await AsyncStorage.setItem(keyIngreso(profile.id), "1");
      }
      await SoundService.reproducir("exito");
      showToast("success", "¡Bienvenido!", "Ingreso al local validado correctamente.");
    } else {
      await SoundService.reproducir("error");
      showToast("error", "Código inválido", "El QR escaneado no es el de ingreso al local.");
    }
  };

  const handleMesaQr = async (data: string) => {
    if (!mesa || !profile) return;

    let mesaIdEscaneada: string | null = null;
    try {
      const parsed = JSON.parse(data);
      mesaIdEscaneada = parsed.mesaId ?? parsed.id ?? null;
    } catch {
      mesaIdEscaneada = data.trim();
    }

    if (mesaIdEscaneada !== mesa.id) {
      await SoundService.reproducir("error");
      showToast("error", "Mesa incorrecta", "Este QR no corresponde a tu mesa asignada.");
      return;
    }

    const { exito, error } = await vincularClienteAMesa(profile.id, mesa.id);
    if (!exito) {
      await SoundService.reproducir("error");
      showToast("error", "Error", error || "No se pudo vincular la mesa. Reintentá.");
      return;
    }

    await refetch();
    await SoundService.reproducir("exito");
    showToast("success", "¡Mesa vinculada!", "Ya podés ver el menú y consultar al mozo.");
  };

  const handleQrScanned = async (data: string) => {
    setScannerVisible(false);
    try {
      if (scanMode === "ingreso") {
        await handleIngresoQr(data);
      } else {
        await handleMesaQr(data);
      }
    } catch (e) {
      showToast("error", "Error", "Ocurrió un error al procesar el código.");
    }
  };

  const logOut = async () => {
    const { error } = await signOut();
    if (error) {
      await SoundService.reproducir("error");
      showToast("error", "Error", "Error al cerrar sesión");
    } else if (profile !== null) {
      router.replace("/log-in");
    }
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleQrScanned}
        title={scanMode === "ingreso" ? "Ingreso al Local" : "Escaneá el QR de tu mesa"}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <View className="flex-1 px-5">
          {/* Card de saludo — siempre visible */}
          <View className="bg-[#FFF4E6] rounded-3xl p-4 items-center mb-4 shadow-sm border border-white/60 relative">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMostrarModal(true)}
              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-red-500 items-center justify-center shadow-sm z-10"
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="relative mt-1">
              <Image
                source={{ uri: profile?.foto_url || "https://placehold.co/150" }}
                className="w-30 h-30 rounded-full border-4 border-white"
                resizeMode="cover"
              />
              <View className="absolute bottom-1 right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-white items-center justify-center">
                <Ionicons name="checkmark" size={14} color="#FFF" />
              </View>
            </View>
            <Text className="text-2xl font-black text-[#1E2342] mt-2.5">¡Hola, {profile?.nombres}!</Text>
          </View>

          {/* Card de opciones (encuestas + estado de mesa) — visible desde que se escanea el QR de ingreso */}
          {qrEscaneado && (
            <View
              className={`bg-[#FFF4E6] rounded-3xl p-6 border border-white/60 shadow-sm ${
                esCasoB ? "flex-1 justify-between mb-2" : "mb-4"
              }`}
            >
              <View className="w-full items-center">
                <View className="w-12 h-12 bg-white/80 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="restaurant-outline" size={26} color="#FF6B00" />
                </View>
                <Text className="text-xl font-black text-[#1E2342] text-center mb-1">
                  Opciones del local habilitadas
                </Text>
                <View className="w-full h-[1px] bg-[#F0DFC8] my-2" />

                <View className="w-full mt-1 space-y-2.5">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onEncuestasPress}
                    className="flex-row items-center mb-2 p-3 rounded-2xl border bg-white border-orange-200 shadow-sm"
                  >
                    <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#FF6B00" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-[#1E2342]">Ver encuestas</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                  </TouchableOpacity>

                  {/* Fila de estado de mesa: cambia según el paso, sin agregar cards extra */}
                  <TouchableOpacity
                    onPress={onListaEsperaPress}
                    disabled={enListaDeEspera || mesaHabilitada || tieneMesa}
                    className={`flex-row items-center p-3 rounded-2xl border ${
                       mesaHabilitada || tieneMesa
                        ? "bg-brand-400 border-amber-200 opacity-90 shadow-sm"
                        : enListaDeEspera
                          ? "bg-brand-100 border-amber-200 opacity-90 shadow-sm"
                          : "bg-white border-orange-200 shadow-sm"
                    }`}
                  >
                    <View
                      className={`w-9 h-9 rounded-xl items-center justify-center mr-3 overflow-hidden ${
                        tieneMesa
                          ? "bg-black"
                          : enListaDeEspera
                            ? "bg-orange-300"
                            : "bg-orange-100"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={tieneMesa ? "table-chair" : enListaDeEspera ? "clock-check-outline" : "account-clock-outline"}
                        size={20}
                        color={tieneMesa ? "#FFFFFF" : enListaDeEspera ? "#B45309" : "#FF6B00"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-[#1E2342]">
                        {tieneMesa ? `Mesa ${mesa?.numero} - asignada` : enListaDeEspera ? "En espera de asignación" : "Lista de espera"}
                      </Text>
                      <Text className={`text-[13px] font-semibold ${tieneMesa ? "text-white" : "text-[#8A7B6D]"}`}>
                        {tieneMesa
                          ? "Escaneá el QR de tu mesa"
                          : enListaDeEspera
                            ? "Anotado. Esperando al metre"
                            : "Anotate para que te asignen una mesa"}
                      </Text>
                    </View>
                    {!enListaDeEspera && !tieneMesa && <Ionicons name="chevron-forward" size={18} color="#FF6B00" />}
                    {(enListaDeEspera || tieneMesa) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={tieneMesa ? "#FFFFFF" : "#cc6414"}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Información expandida en CASO B: ocupa el largo disponible de forma armónica */}
              {esCasoB && (
                <View
                  className={`w-full mt-6 p-4 rounded-2xl border items-center ${
                    enListaDeEspera
                      ? "bg-brand-100 border-amber-200"
                      : "bg-[#ffff] border-orange-200"
                  }`}
                >
                  <View
                    className={`w-17 h-17 mb-4 rounded-2xl items-center justify-center ${
                      enListaDeEspera ? "bg-orange-300" : "bg-orange-100"
                    }`}
                  >
                    <Ionicons
                      name={enListaDeEspera ? "hourglass-outline" : "information-circle-outline"}
                      size={24}
                      color={enListaDeEspera ? "#B45309" : "#FF6B00"}
                    />
                  </View>
                  <Text className="text-[19px] font-black text-[#1E2342] text-center mb-3">
                    {enListaDeEspera
                      ? "Estás en la lista de espera"
                      : "Siguiente paso: solicitar mesa"}
                  </Text>
                  <Text className="text-lg font-semibold text-[#8A7B6D] text-center leading-4 px-2">
                    {enListaDeEspera
                      ? "El metre te asignará una mesa disponible en breve. Podés aprovechar para responder las encuestas mientras esperás."
                      : "Tocá en 'Lista de espera' para registrar tu turno y que el local pueda asignarte una mesa."}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Card de escaneo — reutilizada: ingreso al local (CASO A) o QR de mesa (CASO C) */}
          {(paso === "ingreso" || paso === "escanear_mesa") && (
            <View className="bg-[#FFF4E6] rounded-3xl p-6 flex-1 items-center justify-between border border-white/60 shadow-sm mb-2">
              <View className="w-full items-center">
                <Text className="text-[11px] font-bold tracking-widest text-[#9E8B79] uppercase text-center">
                  {paso === "ingreso" ? "Ingreso al local" : "Tu mesa asignada"}
                </Text>
                <Text className="text-2xl font-black text-[#1E2342] text-center mt-0.5">
                  {paso === "ingreso" ? "Cámara lista" : `Mesa ${mesa?.numero}`}
                </Text>
              </View>

              <View className="items-center my-auto py-4">
                <View className="w-24 h-24 rounded-3xl bg-white/90 items-center justify-center border border-orange-200 shadow-sm mb-3">
                  <Ionicons
                    name={paso === "ingreso" ? "qr-code-outline" : "camera-outline"}
                    size={48}
                    color="#FF6B00"
                  />
                </View>
                <Text className="text-xs font-semibold text-[#8A7B6D] text-center max-w-[260px] leading-4">
                  {paso === "ingreso"
                    ? "Escaneá el código QR en la entrada del local para acceder a las opciones de espera y encuestas."
                    : "Escaneá el código QR físico de tu mesa para validar tu ubicación y acceder al menú y al chat con el mozo."}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onScanPress}
                activeOpacity={0.85}
                className="w-full py-3.5 rounded-2xl flex-row items-center justify-center shadow-md bg-[#FF6B00] shadow-orange-500/40"
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">
                  {paso === "ingreso" ? "Escanear QR de ingreso" : "Escanear QR de la mesa"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card de acceso a mesa — visible una vez vinculado a la mesa (CASO C) */}
          {mesaVinculada && (
            <View className="bg-[#FFF4E6] rounded-3xl p-6 mb-2 items-center border border-white/60 shadow-sm flex-1 justify-between">
              <View className="w-full items-center">
                <Text className="text-2xl font-black text-[#1E2342] text-center">
                  Mesa {mesa?.numero}
                </Text>
                <View className="w-full h-[1px] bg-[#F0DFC8] my-3" />
              </View>

              <View className="w-full space-y-2.5 my-auto">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: "/menu", params: { mesaId: mesa?.id } })}
                  className="flex-row items-center p-3 mb-2 rounded-2xl border bg-white border-orange-200 shadow-sm"
                >
                  <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#FF6B00" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-[#1E2342]">Ver menú</Text>
                    <Text className="text-xs text-[#8A7B6D]">Comidas y bebidas</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: "/chat", params: { mesaId: mesa?.id } })}
                  className="flex-row items-center p-3 rounded-2xl border bg-white border-orange-200 shadow-sm"
                >
                  <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="chat-outline" size={20} color="#FF6B00" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-[#1E2342]">Chateá con el mozo</Text>
                    <Text className="text-xs text-[#8A7B6D]">Consultas en vivo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={mostrarModal}
        title="Confirmar acción."
        message="¿Desea salir?"
        confirmText="Si"
        cancelText="No"
        action={false}
        onConfirm={logOut}
        onCancel={() => setMostrarModal(false)}
      />
    </View>
  );
}