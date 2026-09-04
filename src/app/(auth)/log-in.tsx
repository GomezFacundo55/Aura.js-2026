import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { validateEmail, validateLoginPassword, isEmployeeRole, isManagerRole } from "@/lib/validation";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { signInWithEmail, resolveHomeRoute } from "@/lib/auth";

export default function LogInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const { route, error: routeError } = await resolveHomeRoute();
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

  const handleSubmitAsRole = async (role: "cocinero" | "cantinero" | "mozo" | "metre" | "cliente" | "dueño") => {
    setTouched({ email: true, password: true });
    setIsSubmitting(true);
    setAuthError(null);

    switch (role) {
      case "cocinero":
        await signInWithEmail("pruebaLuisa@foodly.com", "Luisa1234");
        router.replace("/(app)/dashboard");
        break;
      case "cantinero":
        await signInWithEmail("pruebaCamila@foodly.com", "Camila1234");
        router.replace("/(app)/dashboard");
        break;
      case "mozo":
        await signInWithEmail("pruebaCarlos@foodly.com", "Carlos1234");
        router.replace("/(app)/mozo-home");
        break;
      case "metre":
        await signInWithEmail("pruebaAlfredo@foodly.com", "Alfredo1234");
        router.replace("/(app)/metre-home");
        break;
      case "cliente":
        // Handle cliente login
        break;
      case "dueño":
        await signInWithEmail("prueba@foodly.com", "Maria1234");
        router.replace("/(app)/manager-home");
        break;
    }
  }

  return (
    <AuthScreenLayout>
      <View className="gap-5">
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
          onChangeText={setEmail}
        />

        <PasswordInput
          label="Clave"
          placeholder="Tu clave"
          value={password}
          autoComplete="password"
          error={touched.password ? passwordError : null}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          onChangeText={setPassword}
        />

        <FormError message={authError} onDismiss={() => setAuthError(null)} />

        <Button title="Ingresar" disabled={!isFormValid || isSubmitting} onPress={handleSubmit} />

        <Button title="Ingresar como Cocinero"  onPress={()=>handleSubmitAsRole("cocinero")} />
        <Button title="Ingresar como Cantinero"  onPress={()=>handleSubmitAsRole("cantinero")} />
        <Button title="Ingresar como Mozo"  onPress={()=>handleSubmitAsRole("mozo")} />
        <Button title="Ingresar como Metre"  onPress={()=>handleSubmitAsRole("metre")} />
        <Button title="Ingresar como Cliente"  onPress={()=>handleSubmitAsRole("cliente")} />
        <Button title="Ingresar como Dueño"  onPress={()=>handleSubmitAsRole("dueño")} />

        <View className="flex-row justify-center gap-1">
          <Text className="text-sm text-neutral-600">¿No tenés cuenta?</Text>
          <Link href="/(auth)/sign-up" className="text-sm font-semibold text-brand-600">
            Registrate
          </Link>
        </View>
      </View>
    </AuthScreenLayout>
  );
}
