import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function LogInScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-muted px-6">
      <Text className="text-2xl font-bold text-neutral-900">Pantalla de Login</Text>
      <Text className="mt-3 text-center text-neutral-600">
        Acá vas a poder iniciar sesión con tu cuenta.
      </Text>

      {/* TODO: conectar con Supabase Auth (email/contraseña, OAuth, etc.) */}

      <Link
        href="/"
        className="mt-10 rounded-xl border border-neutral-400 px-6 py-3 text-base font-medium text-neutral-700"
      >
        Volver
      </Link>
    </View>
  );
}
