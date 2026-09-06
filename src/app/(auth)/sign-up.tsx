import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { AvatarCapture } from "@/components/ui/AvatarCapture";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { QRScannerDNI } from "@/components/ui/QRScannerDNI";
import { resolveHomeRoute, signOut, signUpWithProfile } from "@/lib/auth";
import { parseDniQr } from "@/lib/dni-parser";
import {
  validateDni,
  validateEmail,
  validatePasswordConfirm,
  validatePersonName,
  validateSignUpPassword,
} from "@/lib/validation";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type SignUpForm = {
  apellidos: string;
  nombres: string;
  dni: string;
  email: string;
  password: string;
  passwordConfirm: string;
  photoUri: string | null;
};

type TouchedFields = Record<Exclude<keyof SignUpForm, "photoUri">, boolean>;

const INITIAL_TOUCHED: TouchedFields = {
  apellidos: false,
  nombres: false,
  dni: false,
  email: false,
  password: false,
  passwordConfirm: false,
};

export default function SignUpScreen() {
  const [form, setForm] = useState<SignUpForm>({
    apellidos: "",
    nombres: "",
    dni: "",
    email: "",
    password: "",
    passwordConfirm: "",
    photoUri: null,
  });
  const [touched, setTouched] = useState<TouchedFields>(INITIAL_TOUCHED);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(
    () => ({
      apellidos: validatePersonName(form.apellidos, "Apellidos"),
      nombres: validatePersonName(form.nombres, "Nombres"),
      dni: validateDni(form.dni),
      email: validateEmail(form.email),
      password: validateSignUpPassword(form.password),
      passwordConfirm: validatePasswordConfirm(form.password, form.passwordConfirm),
    }),
    [form],
  );

  const isFormValid = Object.values(errors).every((error) => error === null);

  const updateField = <K extends keyof SignUpForm>(key: K, value: SignUpForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const markTouched = (key: keyof TouchedFields) => {
    setTouched((current) => ({ ...current, [key]: true }));
  };

  const handleSubmit = async () => {
    setTouched({
      apellidos: true,
      nombres: true,
      dni: true,
      email: true,
      password: true,
      passwordConfirm: true,
    });

    if (!isFormValid) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const { error } = await signUpWithProfile({
        email: form.email,
        password: form.password,
        nombres: form.nombres,
        apellidos: form.apellidos,
        dni: form.dni,
        photoUri: form.photoUri,
      });

      if (error) {
        setAuthError(error);
        return;
      }

      const { route, pending } = await resolveHomeRoute();
      if (pending || !route) {
        await signOut();
        router.replace({ pathname: "/(auth)/log-in", params: { pendiente: "1" } });
        return;
      }

      router.replace(route);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos completar el registro.";
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrScan = (rawData: string) => {
    const parsed = parseDniQr(rawData);

    if (!parsed) {
      setQrError(
        "No pudimos leer el código del DNI. Verificá que sea el dorso del documento o cargá los datos a mano.",
      );
      return;
    }

    setQrError(null);
    setForm((current) => ({
      ...current,
      apellidos: parsed.apellidos,
      nombres: parsed.nombres,
      dni: parsed.documentNumber,
    }));
    setTouched((current) => ({
      ...current,
      apellidos: true,
      nombres: true,
      dni: true,
    }));
  };

  return (
    <AuthScreenLayout>
      <View className="gap-3">
        <AvatarCapture
          photoUri={form.photoUri}
          onPhotoChange={(uri) => updateField("photoUri", uri)}
        />

        <View>
          <Input
              label="DNI"
              placeholder="Escanee el DNI o ingrese los campos"
              value={form.dni}
              keyboardType="number-pad"
              error={touched.dni ? errors.dni : null}
              onBlur={() => markTouched("dni")}
              onChangeText={(value) => updateField("dni", value.replace(/\D/g, ""))}
              rightElement={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Escanear código del DNI"
                  className="px-2.5 py-2.5"
                  onPress={() => {
                    setQrError(null);
                    setQrScannerVisible(true);
                  }}
                >
                  <Text className="text-sm font-semibold text-brand-600">QR</Text>
                </Pressable>
              }
            />
          {qrError ? <FormError message={qrError} onDismiss={() => setQrError(null)} /> : null}
        </View>

        <Input
          label="Apellidos"
          placeholder="Ej: Pérez"
          value={form.apellidos}
          autoCapitalize="words"
          autoCorrect={false}
          error={touched.apellidos ? errors.apellidos : null}
          onBlur={() => markTouched("apellidos")}
          onChangeText={(value) => updateField("apellidos", value)}
        />

        <Input
          label="Nombres"
          placeholder="Ej: María"
          value={form.nombres}
          autoCapitalize="words"
          autoCorrect={false}
          error={touched.nombres ? errors.nombres : null}
          onBlur={() => markTouched("nombres")}
          onChangeText={(value) => updateField("nombres", value)}
        />

        <Input
          label="Correo electrónico"
          placeholder="nombre@ejemplo.com"
          value={form.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={touched.email ? errors.email : null}
          onBlur={() => markTouched("email")}
          onChangeText={(value) => updateField("email", value)}
        />

        <PasswordInput
          label="Clave"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          autoComplete="new-password"
          error={touched.password ? errors.password : null}
          onBlur={() => markTouched("password")}
          onChangeText={(value) => updateField("password", value)}
        />

        <PasswordInput
          label="Confirmar clave"
          placeholder="Repetí tu clave"
          value={form.passwordConfirm}
          autoComplete="new-password"
          error={touched.passwordConfirm ? errors.passwordConfirm : null}
          onBlur={() => markTouched("passwordConfirm")}
          onChangeText={(value) => updateField("passwordConfirm", value)}
        />

        <FormError message={authError} onDismiss={() => setAuthError(null)} />

        <Button title="Registrarme" disabled={!isFormValid || isSubmitting} onPress={handleSubmit} />
      </View>

      <QRScannerDNI
        visible={qrScannerVisible}
        onClose={() => setQrScannerVisible(false)}
        onScan={handleQrScan}
        onError={(message) => {
          setQrError(message);
          setQrScannerVisible(false);
        }}
      />
    </AuthScreenLayout>
  );
}
