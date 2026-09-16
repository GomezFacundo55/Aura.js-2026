import { useCallback, useEffect, useRef, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { GradientBackground } from "@/components/ui/GradientBackground";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useToast } from "@/contextJ/Toast";
import { useMesaActual } from "@/hooks/useMesaActual";
import { getMyProfile, type UserProfile } from "@/lib/auth";
import {
  enviarMensaje,
  obtenerMensajesDeMesa,
  type MensajeMesa,
  type RolMensajeMesa,
} from "@/servicesJ/mensajesMesaService";
import { SoundService } from "@/servicesJ/soundService";
import { supabase } from "@/servicesJ/supabaseConexion";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();

  const flatListRef = useRef<FlatList<MensajeMesa>>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [numeroMesaFallback, setNumeroMesaFallback] = useState<number | null>(null);

  // Estados de mensajes y red
  const [mensajes, setMensajes] = useState<MensajeMesa[]>([]);
  const [cargandoChat, setCargandoChat] = useState<boolean>(true);
  const [errorChat, setErrorChat] = useState<string | null>(null);

  // Estados del input
  const [texto, setTexto] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);

  // Hook para obtener el número de mesa del cliente
  const { mesa } = useMesaActual(profile?.id);

  // 1. Carga inicial del perfil actual
  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  // 2. Consulta fallback del número de mesa si useMesaActual no lo tiene (ej. acceso directo o mozo)
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

  const numeroMesa = mesa?.numero ?? numeroMesaFallback ?? (mesaId ? "—" : "");

  // 3. Fetch inicial de mensajes y suscripción a Supabase Realtime
  useEffect(() => {
    if (!mesaId) {
      setErrorChat("No se especificó la mesa para el chat.");
      setCargandoChat(false);
      return;
    }

    let isMounted = true;

    async function cargarHistorial() {
      setCargandoChat(true);
      setErrorChat(null);

      const res = await obtenerMensajesDeMesa(mesaId);
      if (!isMounted) return;

      if (!res.exito) {
        setErrorChat(res.error || "No pudimos cargar los mensajes de la mesa.");
      } else {
        setMensajes(res.datos ?? []);
      }
      setCargandoChat(false);
    }

    cargarHistorial();

    /*
      ESTRATEGIA PARA EVITAR MENSAJES DUPLICADOS:
      Confiamos exclusivamente en el evento Realtime (INSERT de Supabase) para
      incorporar los mensajes al estado local 'mensajes' (incluidos los que envía el
      propio usuario). Al pulsar "Enviar", no agregamos el mensaje de forma optimista;
      simplemente disparamos 'enviarMensaje' y limpiamos el TextInput. El canal Realtime
      notifica la inserción a todos los clientes (incluido el emisor), y verificamos
      adicionalmente por 'id' para descartar cualquier evento duplicado por retransmisión de red.
    */
    const topic = `mensajes_mesa_${mesaId}`;
    const canalExistente = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${topic}`);
    if (canalExistente) {
      supabase.removeChannel(canalExistente);
    }

    const canal = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_mesa",
          filter: `mesa_id=eq.${mesaId}`,
        },
        (payload) => {
          const nuevoMensaje = payload.new as MensajeMesa;
          if (!nuevoMensaje || !nuevoMensaje.id) return;

          setMensajes((prev) => {
            // Protección defensiva: si el mensaje ya está en el estado por su ID único, lo ignoramos
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
  }, [mesaId]);

  // 4. Envío de mensaje
  const handleEnviar = async () => {
    const textoAEnviar = texto.trim();
    if (!textoAEnviar || !mesaId || !profile?.id || enviando) {
      return;
    }

    setEnviando(true);
    // Limpiamos el input de inmediato para brindar fluidez
    setTexto("");

    const rolRemitente: RolMensajeMesa =
      profile.perfil === "mozo" ? "mozo" : "cliente";

    const res = await enviarMensaje(
      mesaId,
      profile.id,
      rolRemitente,
      textoAEnviar
    );

    if (!res.exito) {
      // Si falló el envío, restauramos el texto y notificamos
      setTexto(textoAEnviar);
      await SoundService.reproducir("error");
      showToast(
        "error",
        "Error al enviar mensaje",
        res.error || "No se pudo entregar tu mensaje. Intentá nuevamente."
      );
    } else {
      // TODO: Disparar Push Notification para alertar a los mozos sobre una nueva consulta en la mesa
      await SoundService.reproducir("exito");
    }

    setEnviando(false);
  };

  const handleVolver = useCallback(() => {
    if (profile?.perfil === "mozo") {
      router.replace("/(app)/mozo-home");
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

  const renderMensaje = ({ item }: { item: MensajeMesa }) => {
    const esPropio = item.remitente_id === profile?.id;
    const esMozo = item.remitente_rol === "mozo";

    return (
      <View
        className={`mb-3 max-w-[82%] ${
          esPropio ? "self-end items-end" : "self-start items-start"
        }`}
      >
        {/* Identificador del rol de quien escribe (útil si hay varios mozos o comensales) */}
        <View className="flex-row items-center mb-1 px-1">
          {esMozo ? (
            <View className="flex-row items-center bg-orange-100 rounded-md px-1.5 py-0.5 border border-orange-200">
              <MaterialCommunityIcons
                name="account-tie"
                size={12}
                color="#FF6B00"
                style={{ marginRight: 3 }}
              />
              <Text className="text-[10px] font-bold text-[#FF6B00]">
                {esPropio ? "Tú (Mozo)" : "Mozo"}
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
              <Text className="text-[10px] font-bold text-[#8A7B6D]">
                {esPropio ? "Tú (Cliente)" : "Cliente"}
              </Text>
            </View>
          )}
        </View>

        {/* Burbuja de chat */}
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

  return (
    <View className="flex-1">
      <GradientBackground />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-1"
          style={{
            paddingTop: Math.max(insets.top, 16),
          }}
        >
          {/* Header con botón de volver y título de sala */}
          <View className="flex-row items-center px-5 mb-3 justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleVolver}
              className="w-10 h-10 rounded-2xl bg-white/95 items-center justify-center border border-orange-200 shadow-sm"
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B00" />
            </TouchableOpacity>

            <View className="flex-1 mx-3 items-center">
              <Text
                className="text-xl font-black text-[#1E2342] text-center"
                numberOfLines={1}
              >
                {numeroMesa
                  ? `Consulta al mozo — Mesa ${numeroMesa}`
                  : "Consulta al mozo"}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-[11px] font-semibold text-[#8A7B6D]">
                  Chat en vivo
                </Text>
              </View>
            </View>

            {/* Espaciador simétrico */}
            <View className="w-10" />
          </View>

          {/* Banner de error si falla la carga del chat */}
          {errorChat && (
            <View className="px-5 mb-2">
              <ErrorBanner mensaje={errorChat} />
            </View>
          )}

          {/* Estado de carga inicial */}
          {cargandoChat ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text className="mt-3 text-sm font-semibold text-[#8A7B6D]">
                Conectando al chat de la mesa...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={mensajes}
              keyExtractor={(item) => item.id}
              renderItem={renderMensaje}
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
                      <Ionicons
                        name="chatbubbles-outline"
                        size={32}
                        color="#FF6B00"
                      />
                    </View>
                    <Text className="text-lg font-bold text-[#1E2342] text-center mb-1">
                      No hay mensajes todavía
                    </Text>
                    <Text className="text-sm text-[#7A6C5E] text-center">
                      Escribí tu consulta abajo y el mozo te responderá a la
                      brevedad.
                    </Text>
                  </View>
                </View>
              }
            />
          )}

          {/* Barra inferior de entrada de texto */}
          <View
            className="bg-white/95 border-t border-orange-200/80 px-4 py-2.5 flex-row items-center shadow-lg"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribí tu consulta al mozo..."
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
                texto.trim() && !enviando
                  ? "bg-[#FF6B00]"
                  : "bg-orange-300 opacity-60"
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
