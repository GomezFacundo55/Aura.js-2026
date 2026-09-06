import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PENDING_APPROVAL_MESSAGE, resolveHomeRoute, signInWithEmail, signOut } from "@/lib/auth";
import { validateEmail, validateLoginPassword } from "@/lib/validation";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

const QUICK_ACCESS = [
  { id: "cocinero", label: "Cocinero", email: "pruebaLuisa@foodly.com", password: "Luisa1234" },
  { id: "cantinero", label: "Cantinero", email: "pruebaCamila@foodly.com", password: "Camila1234" },
  { id: "mozo", label: "Mozo", email: "pruebaCarlos@foodly.com", password: "Carlos1234" },
  { id: "metre", label: "Metre", email: "pruebaAlfredo@foodly.com", password: "Alfredo1234" },
  { id: "cliente", label: "Cliente", email: "carla@fernandez.com", password: "Carla123" },
  { id: "dueño", label: "Dueño", email: "prueba@foodly.com", password: "Maria1234" },
] as const;

export default function LogInScreen() {
  const params = useLocalSearchParams<{ pendiente?: string | string[] }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedQuickAccess, setSelectedQuickAccess] = useState<string | null>(null);

  useEffect(() => {
    const pendiente = Array.isArray(params.pendiente) ? params.pendiente[0] : params.pendiente;
    if (pendiente === "1") {
      setAuthError(PENDING_APPROVAL_MESSAGE);
    }
  }, [params.pendiente]);

  const emailError = useMemo(() => validateEmail(email), [email]);
  const passwordError = useMemo(() => validateLoginPassword(password), [password]);
  const isFormValid = emailError === null && passwordError === null;

  const handleSubmit = async () => {
    setTouched({ email: true, password: true });

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const { error } = await signInWithEmail(email, password);

      if (error) {
        setAuthError(error);
        return;
      }

      const { route, error: routeError, pending } = await resolveHomeRoute();
      if (pending) {
        await signOut();
        setAuthError(routeError ?? PENDING_APPROVAL_MESSAGE);
        return;
      }

      if (routeError || !route) {
        setAuthError(routeError ?? "No pudimos redirigirte.");
        return;
      }

      router.replace(route);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos iniciar sesión.";
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccess = (id: (typeof QUICK_ACCESS)[number]["id"]) => {
    const account = QUICK_ACCESS.find((item) => item.id === id);
    if (!account) return;

    setSelectedQuickAccess(account.id);
    setEmail(account.email);
    setPassword(account.password);
    setTouched({ email: false, password: false });
    setAuthError(null);
  };

  return (
    <AuthScreenLayout showBack={false}>
      <View className="mt-15 items-center" style={{ marginBottom: 100 }}>
        <Image
          accessibilityLabel="Logo de Sazon"
          source={require("../../../assets/images/LogoSazonNegro.png")}
          style={{ width: 400, height: 104 }}
          resizeMode="contain"
        />
      </View>
      <View className="gap-3">
        <Input
          label="Correo electrónico"
          placeholder="nombre@ejemplo.com"
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={touched.email ? emailError : null}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          onChangeText={(value) => {
            setSelectedQuickAccess(null);
            setEmail(value);
          }}
        />

        <PasswordInput
          label="Clave"
          placeholder="Tu clave"
          value={password}
          autoComplete="password"
          error={touched.password ? passwordError : null}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          onChangeText={(value) => {
            setSelectedQuickAccess(null);
            setPassword(value);
          }}
        />

        <View className="gap-1.5" style={{ marginTop: 30 }}>
          <Text className="text-base font-semibold text-neutral-700">Acceso rápido</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-2 pr-2">
              {QUICK_ACCESS.map((account) => {
                const isSelected = selectedQuickAccess === account.id;

                return (
                  <Pressable
                    key={account.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Completar datos de ${account.label}`}
                    onPress={() => fillQuickAccess(account.id)}
                    className={`rounded-full px-3 py-1.5 ${
                      isSelected ? "bg-brand-500" : "bg-surface-light/85"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-white" : "text-brand-700"
                      }`}
                    >
                      {account.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <FormError message={authError} onDismiss={() => setAuthError(null)} />

        <Button style={{ marginTop: 30 }} title="Ingresar" disabled={!isFormValid || isSubmitting} onPress={handleSubmit} />

        <View className="flex-row justify-center gap-1">
          <Text className="text-base font-medium text-neutral-700">¿No tenés cuenta?</Text>
          <Link href="/(auth)/sign-up" className="text-base font-semibold text-brand-700">
            Registrate
          </Link>
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace("/(onboarding)/guest")}
        >
          <Text className="text-center text-base font-medium text-neutral-700 underline">
            Ingresar como invitado
          </Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
