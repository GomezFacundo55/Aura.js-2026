import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../bd/supabase";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert("Faltan datos", "Completá email y contraseña.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Tiene que tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Error al registrarse", error.message);
      return;
    }

    Alert.alert("Listo", "Cuenta creada. Revisá tu email para confirmar.");
    router.replace("/(auth)/log-in");
  }

  return (
    <View className="flex-1 items-center justify-center bg-surface-muted px-6">
      <Text className="text-2xl font-bold text-neutral-900">Pantalla de Registro</Text>
      <Text className="mt-3 text-center text-neutral-600">
        Acá vas a poder crear una cuenta nueva.
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
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text className="text-center text-base font-medium text-white">
          {loading ? "Creando cuenta..." : "Registrarme"}
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