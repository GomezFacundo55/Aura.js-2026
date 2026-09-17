import { useCallback, useEffect, useState } from "react";
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
import { getMyProfile, type UserProfile } from "@/lib/auth";
import { supabase } from "@/servicesJ/supabaseConexion";

type CategoriaMenu = "comidas" | "bebidas";

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tabSeleccionada, setTabSeleccionada] = useState<CategoriaMenu>("comidas");
  const [numeroMesaFallback, setNumeroMesaFallback] = useState<number | null>(null);

  // Hook que ya resuelve el fetch de platos y bebidas
  const { comidas, bebidas, loading: cargandoMenu, error: errorMenu, recargar } = useMenu();

  // Hook para obtener los datos de la mesa vinculada al cliente actual
  const { mesa } = useMesaActual(profile?.id);

  // Carga inicial del perfil de usuario
  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  // Si useMesaActual aún no tiene el número o se accede por mesaId directo, consultamos el número
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

  const productosActivos = tabSeleccionada === "comidas" ? comidas : bebidas;

  const handleVolver = useCallback(() => {
    if (profile?.perfil === "mozo") {
      router.replace("/(app)/mozo-home");
    } else {
      router.replace("/(app)/home");
    }
  }, [profile?.perfil, router]);

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
        {/* Header con botón de retorno y título */}
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
          </View>

          {/* Espaciador simétrico */}
          <View className="w-10" />
        </View>

        {/* Tabs de selección: Comidas / Bebidas */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-[#FFF4E6] p-1.5 rounded-2xl border border-orange-200 shadow-sm">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTabSeleccionada("comidas")}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                tabSeleccionada === "comidas"
                  ? "bg-[#FF6B00] shadow-sm"
                  : "bg-transparent"
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
                tabSeleccionada === "bebidas"
                  ? "bg-[#FF6B00] shadow-sm"
                  : "bg-transparent"
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

        {/* Banner de error si falla useMenu */}
        {errorMenu && (
          <View className="px-5 mb-2">
            <ErrorBanner mensaje={errorMenu} />
          </View>
        )}

        {/* Loading state mientras cargandoMenu es true */}
        {cargandoMenu ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="mt-3 text-sm font-semibold text-[#8A7B6D]">
              Cargando el menú...
            </Text>
          </View>
        ) : (
          <FlatList
            data={productosActivos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ProductoCard producto={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 40,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={cargandoMenu}
                onRefresh={recargar}
                tintColor="#FF6B00"
              />
            }
            ListEmptyComponent={
              <View className="bg-[#FFF4E6] rounded-3xl p-8 items-center justify-center border border-white/60 shadow-sm mt-4">
                <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-3">
                  <Ionicons
                    name={
                      tabSeleccionada === "comidas"
                        ? "restaurant-outline"
                        : "wine-outline"
                    }
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
    </View>
  );
}
