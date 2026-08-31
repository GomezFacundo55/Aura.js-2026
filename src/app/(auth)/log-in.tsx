import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../bd/supabase";

export default function LogInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Faltan datos", "Completá email y contraseña.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Error al iniciar sesión", error.message);
      return;
    }

    router.replace("/(app)/home");
  }

  return (
    <View className="flex-1 items-center justify-center bg-surface-muted px-6">
      <Text className="text-2xl font-bold text-neutral-900">Pantalla de Login</Text>
      <Text className="mt-3 text-center text-neutral-600">
      </Text>

      <TextInput
        className="mt-8 w-full rounded-xl border border-neutral-400 px-4 py-3 text-base"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        className="mt-3 w-full rounded-xl border border-neutral-400 px-4 py-3 text-base"
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="mt-6 w-full rounded-xl bg-neutral-900 px-6 py-3"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-center text-base font-medium text-white">
          {loading ? "Ingresando..." : "Ingresar"}
        </Text>
      </TouchableOpacity>

      <Link
        href="/"
        className="mt-6 rounded-xl border border-neutral-400 px-6 py-3 text-base font-medium text-neutral-700"
      >
        Volver
      </Link>
    </View>
  );
}