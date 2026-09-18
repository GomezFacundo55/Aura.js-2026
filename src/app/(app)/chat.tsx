import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { GradientBackground } from "@/components/ui/GradientBackground";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useToast } from "@/contextJ/Toast";
import { useMesaActual } from "@/hooks/useMesaActual";
import { getMyProfile, type UserProfile } from "@/lib/auth";
import {
  enviarMensaje,
  obtenerMensajesChatGeneral,
  type MensajeMesa,
  type RolMensajeMesa,
} from "@/servicesJ/mensajesMesaService";
import { SoundService } from "@/servicesJ/soundService";
import { supabase } from "@/servicesJ/supabaseConexion";

// Tipo auxiliar para intercalar separadores de fecha entre los mensajes
type ItemLista =
  | { tipo: "separador"; id: string; etiqueta: string }
  | { tipo: "mensaje"; id: string; data: MensajeMesa };

// Roles que consideramos "staff" (no cliente) a los efectos de mostrar el nombre
const ROLES_STAFF = new Set(["mozo", "dueño", "dueno", "supervisor"]);

const TOPIC_CHAT_GENERAL = "mensajes_mesa_general";

// El staff se identifica por su nombre de pila (primera palabra del campo "nombres")
function primerNombre(nombreCompleto?: string | null): string {
  if (!nombreCompleto) return "Staff";
  return nombreCompleto.trim().split(/\s+/)[0];
}

// Traduce el perfil del usuario logueado al rol que va al chat
function obtenerRolMensaje(perfil?: string | null): RolMensajeMesa {
  if (perfil === "mozo" || perfil === "dueño" || perfil === "dueno" || perfil === "supervisor") {
    return perfil;
  }
  return "cliente";
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const flatListRef = useRef<FlatList<ItemLista>>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Estados de mensajes y red
  const [mensajes, setMensajes] = useState<MensajeMesa[]>([]);
  const [cargandoChat, setCargandoChat] = useState<boolean>(true);
  const [errorChat, setErrorChat] = useState<string | null>(null);

  // Estados del input
  const [texto, setTexto] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);

  // Solo relevante para clientes: su propia mesa (para adjuntarla a lo que envían)
  const { mesa } = useMesaActual(profile?.id);

  const rolMensaje = obtenerRolMensaje(profile?.perfil);
  const esClienteActual = rolMensaje === "cliente";
  const numeroMesaPropia = mesa?.numero ?? null;

  // 1. Carga inicial del perfil actual
  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  // 2. Fetch inicial del historial general y suscripción a Supabase Realtime (sala única, sin filtro por mesa)
  useEffect(() => {
    let isMounted = true;

    async function cargarHistorial() {
      setCargandoChat(true);
      setErrorChat(null);

      const res = await obtenerMensajesChatGeneral();
      if (!isMounted) return;

      if (!res.exito) {
        setErrorChat(res.error || "No pudimos cargar los mensajes del chat.");
      } else {
        setMensajes(res.datos ?? []);
      }
      setCargandoChat(false);
    }

    cargarHistorial();

    /*
      ESTRATEGIA PARA EVITAR MENSAJES DUPLICADOS:
      Igual que antes, confiamos exclusivamente en el evento Realtime (INSERT) para
      incorporar mensajes al estado local, incluidos los propios. No hacemos insert
      optimista; disparamos 'enviarMensaje' y limpiamos el input. El canal notifica
      a todos los clientes conectados a la sala general, y verificamos por 'id' para
      descartar duplicados por retransmisión de red.
    */
    const canalExistente = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${TOPIC_CHAT_GENERAL}`);
    if (canalExistente) {
      supabase.removeChannel(canalExistente);
    }

    const canal = supabase
      .channel(TOPIC_CHAT_GENERAL)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_mesa",
        },
        (payload) => {
          const nuevoMensaje = payload.new as MensajeMesa;
          if (!nuevoMensaje || !nuevoMensaje.id) return;

          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevoMensaje.id)) {
              return prev;
            }
            return [...prev, nuevoMensaje];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(canal);
    };
  }, []);

  // 3. Envío de mensaje
  const handleEnviar = async () => {
    const textoAEnviar = texto.trim();
    if (!textoAEnviar || !profile?.id || enviando) {
      return;
    }

    if (esClienteActual && !numeroMesaPropia) {
      showToast(
        "error",
        "No pudimos identificar tu mesa",
        "Escaneá el QR de tu mesa para poder chatear."
      );
      return;
    }

    setEnviando(true);
    setTexto("");

    const res = await enviarMensaje(profile.id, rolMensaje, textoAEnviar, {
      numeroMesa: numeroMesaPropia,
      nombreRemitente: primerNombre(profile.nombres),
    });

    if (!res.exito) {
      setTexto(textoAEnviar);
      await SoundService.reproducir("error");
      showToast(
        "error",
        "Error al enviar mensaje",
        res.error || "No se pudo entregar tu mensaje. Intentá nuevamente."
      );
    } else {
      await SoundService.reproducir("exito");
    }

    setEnviando(false);
  };

  const handleVolver = useCallback(() => {
    if (profile?.perfil === "mozo") {
      router.replace("/(app)/mozo-home");
    } else if (profile?.perfil === "dueño" || profile?.perfil === "supervisor") {
      router.replace("/(app)/manager-home");
    } else {
      router.replace("/(app)/home");
    }
  }, [profile?.perfil, router]);

  const formatearHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const formatearEtiquetaFecha = (isoDate: string) => {
    try {
      const fecha = new Date(isoDate);
      const hoy = new Date();
      const ayer = new Date();
      ayer.setDate(hoy.getDate() - 1);

      const esMismoDia = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

      if (esMismoDia(fecha, hoy)) return "Hoy";
      if (esMismoDia(fecha, ayer)) return "Ayer";

      const dd = String(fecha.getDate()).padStart(2, "0");
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      const aa = String(fecha.getFullYear()).slice(-2);
      return `${dd}/${mm}/${aa}`;
    } catch {
      return "";
    }
  };

  // 4. Intercalamos separadores de fecha entre los mensajes
  const itemsLista = useMemo<ItemLista[]>(() => {
    const resultado: ItemLista[] = [];
    let claveDiaAnterior: string | null = null;

    for (const msg of mensajes) {
      const fechaMsg = new Date(msg.created_at);
      const claveDia = fechaMsg.toDateString();

      if (claveDia !== claveDiaAnterior) {
        resultado.push({
          tipo: "separador",
          id: `separador-${claveDia}`,
          etiqueta: formatearEtiquetaFecha(msg.created_at),
        });
        claveDiaAnterior = claveDia;
      }

      resultado.push({ tipo: "mensaje", id: msg.id, data: msg });
    }

    return resultado;
  }, [mensajes]);

  const renderSeparadorFecha = (etiqueta: string) => (
    <View className="items-center my-3">
      <View className="bg-white/90 rounded-full px-3 py-1 border border-orange-200 shadow-sm">
        <Text className="text-[11px] font-bold text-[#8A7B6D]">{etiqueta}</Text>
      </View>
    </View>
  );

  const renderMensaje = (item: MensajeMesa) => {
    const esPropio = item.remitente_id === profile?.id;
    const esStaff = ROLES_STAFF.has(item.remitente_rol);

    // Identidad mostrada en la burbuja: mesa (cliente) o nombre de pila (staff)
    const etiquetaSuperior = esStaff
      ? item.remitente_nombre || "Staff"
      : item.mesa_numero != null
      ? `Mesa ${item.mesa_numero}`
      : "Mesa —";

    return (
      <View
        className={`mb-3 max-w-[82%] ${
          esPropio ? "self-end items-end" : "self-start items-start"
        }`}
      >
        <View className="flex-row items-center mb-1 px-1">
          {esStaff ? (
            <View className="flex-row items-center bg-orange-100 rounded-md px-1.5 py-0.5 border border-orange-200">
              <MaterialCommunityIcons
                name="account-tie"
                size={12}
                color="#FF6B00"
                style={{ marginRight: 3 }}
              />
              <Text className="text-[13px] font-bold text-[#FF6B00]">
                {esPropio ? `Tú (${etiquetaSuperior})` : etiquetaSuperior}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center bg-stone-100 rounded-md px-1.5 py-0.5 border border-stone-200">
              <Ionicons
                name="person-outline"
                size={11}
                color="#8A7B6D"
                style={{ marginRight: 3 }}
              />
              <Text className="text-[13px] font-bold text-[#8A7B6D]">
                {esPropio ? `Tú (${etiquetaSuperior})` : etiquetaSuperior}
              </Text>
            </View>
          )}
        </View>

        <View
          className={`p-3.5 shadow-sm ${
            esPropio
              ? "bg-[#FF6B00] rounded-3xl rounded-tr-sm"
              : "bg-[#FFF4E6] rounded-3xl rounded-tl-sm border border-orange-200"
          }`}
        >
          <Text
            className={`text-[15px] leading-5 ${
              esPropio ? "text-white font-medium" : "text-[#1E2342] font-medium"
            }`}
          >
            {item.contenido}
          </Text>

          <Text
            className={`text-[10px] mt-1 self-end ${
              esPropio ? "text-white/80" : "text-[#8A7B6D]"
            }`}
          >
            {formatearHora(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderItemLista = ({ item }: { item: ItemLista }) => {
    if (item.tipo === "separador") {
      return renderSeparadorFecha(item.etiqueta);
    }
    return renderMensaje(item.data);
  };

  return (
    <View className="flex-1">
      <GradientBackground />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <View className="flex-row items-center px-5 mb-3 justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleVolver}
              className="w-10 h-10 rounded-2xl bg-white/95 items-center justify-center border border-orange-200 shadow-sm"
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B00" />
            </TouchableOpacity>

            <View className="flex-1 mx-3 items-center">
              <Text className="text-xl font-black text-[#1E2342] text-center" numberOfLines={1}>
                Chat del salón
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-[11px] font-semibold text-[#8A7B6D]">
                  {esClienteActual && numeroMesaPropia
                    ? `Chat en vivo · Mesa ${numeroMesaPropia}`
                    : "Chat en vivo"}
                </Text>
              </View>
            </View>

            <View className="w-10" />
          </View>

          {errorChat && (
            <View className="px-5 mb-2">
              <ErrorBanner mensaje={errorChat} />
            </View>
          )}

          {cargandoChat ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text className="mt-3 text-sm font-semibold text-[#8A7B6D]">
                Conectando al chat...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={itemsLista}
              keyExtractor={(item) => item.id}
              renderItem={renderItemLista}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 16,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }}
              onLayout={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center p-6">
                  <View className="bg-[#FFF4E6] rounded-3xl p-8 items-center border border-white/60 shadow-sm">
                    <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-3">
                      <Ionicons name="chatbubbles-outline" size={32} color="#FF6B00" />
                    </View>
                    <Text className="text-lg font-bold text-[#1E2342] text-center mb-1">
                      No hay mensajes todavía
                    </Text>
                    <Text className="text-sm text-[#7A6C5E] text-center">
                      Escribí tu consulta abajo, el staff la va a ver acá.
                    </Text>
                  </View>
                </View>
              }
            />
          )}

          <View
            className="bg-white/95 border-t border-orange-200/80 px-4 py-2.5 flex-row items-center shadow-lg"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribí un mensaje..."
              placeholderTextColor="#9E8B79"
              multiline
              maxLength={500}
              className="flex-1 bg-[#FFF4E6] border border-orange-200 rounded-2xl px-4 py-2.5 text-[#1E2342] mr-2 text-[15px] max-h-24 font-medium"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleEnviar}
              disabled={!texto.trim() || enviando}
              className={`w-11 h-11 rounded-2xl items-center justify-center shadow-sm ${
                texto.trim() && !enviando ? "bg-[#FF6B00]" : "bg-orange-300 opacity-60"
              }`}
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}