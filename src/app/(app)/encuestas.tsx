import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/ui/GradientBackground";
import { useToast } from "@/contextJ/Toast";
import { useMesaActual } from "@/hooks/useMesaActual";
import { getMyProfile, type UserProfile } from "@/lib/auth";
import { EncuestaFormScreen } from "@/screensJ/encuestaFormScreen";
import { GraficoAtencionScreen } from "@/screensJ/graficoAtencionScreen";
import { GraficoComidaScreen } from "@/screensJ/graficoComidaScreen";
import { GraficoTiempoEsperaScreen } from "@/screensJ/graficoTiempoEsperaScreen";
import { GraficoLimpiezaScreen } from "@/screensJ/graficoLimpiezaScreen";
import { consultarMesaAsignadaVinculada } from "@/servicesJ/mesaAsignadaService";
import { SoundService } from "@/servicesJ/soundService";

type TabPrincipal = "graficos" | "responder";
type TipoGrafico = "atencion" | "comida" | "tiempo" | "limpieza";

export default function EncuestasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ mesaId?: string; esperaId?: string; soloGraficos?: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [listaEsperaId, setListaEsperaId] = useState<string | null>(params.esperaId ?? null);
  const [mesaFisicaId, setMesaFisicaId] = useState<string | null>(params.mesaId ?? null);
  const [yaRespondio, setYaRespondio] = useState<boolean>(false);
  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>("graficos");
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>("atencion");

  // Si soloGraficos="1" el cliente solo puede ver estadísticas, no responder
  const soloModoGraficos = params.soloGraficos === "1";

  const { mesa } = useMesaActual(profile?.id);
  const mesaIdReal = mesaFisicaId || params.mesaId || mesa?.id || "";

  useEffect(() => {
    let montado = true;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!montado) return;
        setProfile(p);

        if (p?.id) {
          const res = await consultarMesaAsignadaVinculada(p.id);
          if (montado && res.exito && res.datos?.lista_espera_id) {
            setListaEsperaId(res.datos.lista_espera_id);
            setMesaFisicaId(res.datos.mesa_id);
            setYaRespondio(!!res.yaRespondio);
          } else if (montado) {
            setListaEsperaId(null);
            setYaRespondio(false);
          }
        }
      } catch (e) {
        console.error("Error al cargar datos en encuestas:", e);
      } finally {
        if (montado) setCargando(false);
      }
    })();
    return () => {
      montado = false;
    };
  }, []);

  const handleVolver = useCallback(() => {
    if (profile?.perfil === "mozo") {
      router.replace("/(app)/mozo-home");
    } else {
      router.replace("/(app)/home");
    }
  }, [profile?.perfil, router]);

  const puedeResponder = !!listaEsperaId && !yaRespondio;

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
        {/* Encabezado */}
        <View className="flex-row items-center px-5 mb-3 justify-between">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleVolver}
            className="w-10 h-10 rounded-2xl bg-white/95 items-center justify-center border border-orange-200 shadow-sm"
          >
            <Ionicons name="arrow-back" size={20} color="#FF6B00" />
          </TouchableOpacity>

          <View className="flex-1 mx-3 items-center">
            <Text className="text-2xl font-black text-[#1E2342] text-center" numberOfLines={1}>
              Encuestas
            </Text>
          </View>

          <View className="w-10" />
        </View>

        {/* Selector de modo: Gráficos vs Responder — oculto en modo solo-estadísticas */}
        {!soloModoGraficos && (
        <View className="flex-row mx-5 mb-3 p-1 bg-white/80 rounded-2xl border border-orange-200 shadow-sm">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTabPrincipal("graficos")}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${tabPrincipal === "graficos" ? "bg-[#FF6B00] shadow-sm" : "bg-transparent"
              }`}
          >
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={18}
              color={tabPrincipal === "graficos" ? "#FFFFFF" : "#8A7B6D"}
              style={{ marginRight: 6 }}
            />
            <Text
              className={`text-sm font-bold ${tabPrincipal === "graficos" ? "text-white" : "text-[#8A7B6D]"
                }`}
            >
              Ver Estadísticas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTabPrincipal("responder")}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${tabPrincipal === "responder" ? "bg-[#FF6B00] shadow-sm" : "bg-transparent"
              }`}
          >
            <MaterialCommunityIcons
              name="pencil-box-outline"
              size={18}
              color={tabPrincipal === "responder" ? "#FFFFFF" : "#8A7B6D"}
              style={{ marginRight: 6 }}
            />
            <Text
              className={`text-sm font-bold ${tabPrincipal === "responder" ? "text-white" : "text-[#8A7B6D]"
                }`}
            >
              Responder
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Contenido según el tab seleccionado */}
        {tabPrincipal === "graficos" ? (
          <View className="flex-1 flex-col">
            {/* Sub-selector de gráficos con 4 categorías */}
            <View className="mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTipoGrafico("atencion")}
                  className={`px-3.5 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                    tipoGrafico === "atencion"
                      ? "bg-[#FF6B00] border-orange-600 shadow-xs"
                      : "bg-white border-orange-200"
                  }`}
                >
                  <Text
                    className={`text-sm  font-bold ${
                      tipoGrafico === "atencion" ? "text-white" : "text-[#1E2342]"
                    }`}
                  >
                    Atención
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTipoGrafico("comida")}
                  className={`px-3.5 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                    tipoGrafico === "comida"
                      ? "bg-[#FF6B00] border-orange-600 shadow-xs"
                      : "bg-white border-orange-200"
                  }`}
                >
                  <Text
                    className={`text-sm  font-bold ${
                      tipoGrafico === "comida" ? "text-white" : "text-[#1E2342]"
                    }`}
                  >
                    Comida
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTipoGrafico("tiempo")}
                  className={`px-3.5 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                    tipoGrafico === "tiempo"
                      ? "bg-[#FF6B00] border-orange-600 shadow-xs"
                      : "bg-white border-orange-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      tipoGrafico === "tiempo" ? "text-white" : "text-[#1E2342]"
                    }`}
                  >
                    Tiempo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTipoGrafico("limpieza")}
                  className={`px-3.5 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                    tipoGrafico === "limpieza"
                      ? "bg-[#FF6B00] border-orange-600 shadow-xs"
                      : "bg-white border-orange-200"
                  }`}
                >
                  <Text
                    className={`text-sm  font-bold ${
                      tipoGrafico === "limpieza" ? "text-white" : "text-[#1E2342]"
                    }`}
                  >
                    Limpieza
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Contenedor del gráfico seleccionado: uno a la vez */}
            <View className="flex-1 mx-5 mb-2 rounded-3xl bg-white border border-orange-200/70 shadow-sm overflow-hidden">
              {tipoGrafico === "atencion" && <GraficoAtencionScreen />}
              {tipoGrafico === "comida" && <GraficoComidaScreen />}
              {tipoGrafico === "tiempo" && <GraficoTiempoEsperaScreen />}
              {tipoGrafico === "limpieza" && <GraficoLimpiezaScreen />}
            </View>
          </View>
        ) : (
          <View className="flex-1">
            {cargando ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text className="mt-2 text-sm text-[#8A7B6D]">Verificando estado...</Text>
              </View>
            ) : puedeResponder ? (
              <View className="flex-1 mx-5 mb-2 rounded-3xl bg-white border border-orange-200/70 shadow-sm overflow-hidden">
                <EncuestaFormScreen
                  listaEsperaId={listaEsperaId!}
                  clienteId={profile?.id ?? ""}
                  mesaId={mesaIdReal}
                  onEnviada={() => {
                    showToast(
                      "success",
                      "¡Muchas gracias!",
                      "Tu encuesta fue registrada correctamente."
                    );
                    SoundService.reproducir("exito");
                    setYaRespondio(true);
                    setTabPrincipal("graficos");
                  }}
                />
              </View>
            ) : (
              <View className="flex-1 mx-5 mb-2 rounded-3xl bg-white p-6 items-center justify-center border border-orange-200/70 shadow-sm">
                <View className="w-16 h-16 rounded-2xl bg-orange-100 items-center justify-center mb-3">
                  <MaterialCommunityIcons
                    name="clipboard-alert-outline"
                    size={32}
                    color="#FF6B00"
                  />
                </View>
                <Text className="text-lg font-bold text-[#1E2342] text-center mb-1">
                  {yaRespondio ? "Ya completaste la encuesta" : "Todavía no tenés mesa asignada"}
                </Text>
                <Text className="text-sm text-[#8A7B6D] text-center px-4 mb-4">
                  {yaRespondio
                    ? "Gracias por tu respuesta anterior. Sólo se puede completar una encuesta por estadía."
                    : "Para responder la encuesta de satisfacción necesitás tener una mesa asignada y vinculada."}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleVolver}
                  className="px-5 py-2.5 rounded-xl bg-[#FF6B00]"
                >
                  <Text className="text-white font-bold text-sm">Ir al Inicio</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}