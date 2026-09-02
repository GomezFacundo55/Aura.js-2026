import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      {/* Fondo degradado */}
      <LinearGradient
        colors={["#FF7A4D", "#FF5A36", "#D93A24"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="absolute inset-0"
      />

      {/* Blobs decorativos */}
      <View
        className="absolute top-20 -right-10 w-60 h-60 rounded-full bg-brand-900 opacity-30"
        pointerEvents="none"
      />
      <View
        className="absolute top-120 -left-16 w-90 h-90 rounded-full bg-brand-900 opacity-20"
        pointerEvents="none"
      />

      <View className="items-center gap-3">
        <Image source={require("../../assets/images/Logo.png")} className="w-61 h-16" />
      </View>

      <View className="mt-30 w-full max-w-sm gap-4">
        <Link href="/(auth)/log-in" asChild>
          <TouchableOpacity
            activeOpacity={0.85}
            className="rounded-xl bg-surface-light py-4"
          >
            <Text className="text-center text-base font-semibold text-brand-600">
              Iniciar sesión
            </Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity
            activeOpacity={0.85}
            className="rounded-xl bg-brand-400 py-4"
          >
            <Text className="text-center text-base font-semibold text-white">
              Registrarme
            </Text>
          </TouchableOpacity>
        </Link>

        <Link
          href="/(onboarding)/guest"
          className="py-2 text-center text-base text-white font-medium underline"
        >
          Ingresar como invitado
        </Link>
      </View>
    </View>
  );
}
