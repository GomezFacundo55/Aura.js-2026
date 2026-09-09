import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { isManagerRole } from "@/lib/validation";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useToast } from "../../contextJ/Toast";
import { Ionicons } from "@expo/vector-icons";

interface LargeActionCardProps {
  href: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badge?: string;
  bgClass: string;
  textClass: string;
  subtextClass: string;
  iconColor: string;
  fullWidth?: boolean;
}

function LargeActionCard({
  href,
  title,
  subtitle,
  iconName,
  badge,
  bgClass,
  textClass,
  subtextClass,
  iconColor,
  fullWidth = false,
}: LargeActionCardProps) {
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity
        activeOpacity={0.8}
        className={`flex-1 min-h-[140px] rounded-lg p-5 justify-between shadow-sm active:scale-[0.98] transition-all ${bgClass} ${
          fullWidth ? "w-full" : "w-[48%]"
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="h-12 w-12 items-center justify-center rounded-md bg-white/20 backdrop-blur-md">
            <Ionicons name={iconName} size={26} color={iconColor} />
          </View>
          {badge ? (
            <View className="bg-brand-500 px-3 py-1 rounded-full shadow-sm">
              <Text className="text-xs font-bold text-white uppercase tracking-wider">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4">
          <Text className={`text-xl font-bold leading-tight ${textClass}`}>
            {title}
          </Text>
          <Text className={`mt-1 text-xs font-medium ${subtextClass}`}>
            {subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const logOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast("error", "Error", "Error al cerrar sesión");
    } else {
      router.replace("/log-in");
    }
  };

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  const canManageStaff = isManagerRole(profile?.perfil);

  return (
    <AuthScreenLayout showBack={false}>
      <View className="flex-1 justify-between pb-4">
        {/* Encabezado compacto */}
        <View className="flex-row items-center justify-between py-2 border-b border-neutral-400/20 mb-4">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-brand-500 items-center justify-center shadow-sm">
              <Text className="text-base font-bold text-white uppercase">
                {profile?.perfil?.substring(0, 2) || "US"}
              </Text>
            </View>
            <View>
              <Text className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                Panel de gestión
              </Text>
              <Text className="text-base font-bold text-neutral-900 capitalize">
                {profile?.perfil || "Cargando..."}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={logOut}
            className="h-10 w-10 items-center justify-center rounded-md bg-danger/10 active:bg-danger/20"
          >
            <Ionicons name="log-out-outline" size={22} color="#E3372F" />
          </TouchableOpacity>
        </View>

        {/* Módulo Dinámico Principal */}
        {canManageStaff && (
          <View className="flex-1 gap-3 justify-between">
            {/* Tarjeta 1: Clientes Pendientes */}
            <LargeActionCard
              href="/clientes/pendientes"
              title="Clientes Pendientes"
              subtitle="Aprobar o rechazar nuevos registros de clientes"
              iconName="people-outline"
              bgClass="bg-brand-500"
              textClass="text-white"
              subtextClass="text-darj-400"
              iconColor="#FFFFFF"
              fullWidth
            />

            {/* Fila 2: Dos botones grandes en paralelo */}
            <View className="flex-1 flex-row gap-3">
              <LargeActionCard
                href="/(app)/alta-empleado"
                title="Alta de Empleado"
                subtitle="Registrar nuevo personal"
                iconName="person-add-outline"
                bgClass="bg-brand-50"
                textClass="text-brand-900"
                subtextClass="text-brand-700"
                iconColor="#D93A24"
              />

              <LargeActionCard
                href="/mesas/nueva"
                title="Agregar Mesa"
                subtitle="Crear nuevo espacio"
                iconName="add-circle-outline"
                bgClass="bg-brand-500"
                textClass="text-white"
                subtextClass="text-brand-100"
                iconColor="#FFFFFF"
              />
            </View>

            {/* Tarjeta 3: Ver Listado de Mesas */}
            <LargeActionCard
              href="/mesas"
              title="Ver Listado de Mesas"
              subtitle="Monitoreo de estado y ocupación en tiempo real"
              iconName="grid-outline"
              bgClass="bg-surface-muted border border-neutral-400/20"
              textClass="text-neutral-900"
              subtextClass="text-neutral-600"
              iconColor="#1C1C1E"
              fullWidth
            />
          </View>
        )}
      </View>
    </AuthScreenLayout>
  );
}