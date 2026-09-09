import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { AvatarCapture } from "@/components/ui/AvatarCapture";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { QRScannerDNI } from "@/components/ui/QRScannerDNI";
import { SelectPicker } from "@/components/ui/SelectPicker";
import { createEmployeeAccount, getMyProfile } from "@/lib/auth";
import { parseDniQr } from "@/lib/dni-parser";
import {
  EMPLOYEE_PROFILE_OPTIONS,
  isManagerRole,
  type ProfileRole,
  validateCuit,
  validateDni,
  validateEmail,
  validateEmployeeProfile,
  validatePasswordConfirm,
  validatePersonName,
  validateSignUpPassword,
} from "@/lib/validation";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type EmployeeForm = {
  apellidos: string;
  nombres: string;
  dni: string;
  cuit: string;
  email: string;
  password: string;
  passwordConfirm: string;
  perfil: string;
  photoUri: string | null;
};

type TouchedFields = Record<Exclude<keyof EmployeeForm, "photoUri">, boolean>;

const INITIAL_TOUCHED: TouchedFields = {
  apellidos: false,
  nombres: false,
  dni: false,
  cuit: false,
  email: false,
  password: false,
  passwordConfirm: false,
  perfil: false,
};

export default function AltaEmpleadoScreen() {
  const [allowed, setAllowed] = useState(false);
  const [form, setForm] = useState<EmployeeForm>({
    apellidos: "",
    nombres: "",
    dni: "",
    cuit: "",
    email: "",
    password: "",
    passwordConfirm: "",
    perfil: "",
    photoUri: null,
  });
  const [touched, setTouched] = useState<TouchedFields>(INITIAL_TOUCHED);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const profile = await getMyProfile();
      if (!isManagerRole(profile?.perfil)) {
        router.replace("/(app)/manager-home");
        return;
      }
      setAllowed(true);
    };

    checkRole();
  }, []);

  const errors = useMemo(
    () => ({
      apellidos: validatePersonName(form.apellidos, "Apellidos"),
      nombres: validatePersonName(form.nombres, "Nombres"),
      dni: validateDni(form.dni),
      cuit: validateCuit(form.cuit),
      email: validateEmail(form.email),
      password: validateSignUpPassword(form.password),
      passwordConfirm: validatePasswordConfirm(
        form.password,
        form.passwordConfirm,
      ),
      perfil: validateEmployeeProfile(form.perfil),
    }),
    [form],
  );

  const isFormValid = Object.values(errors).every((error) => error === null);

  const updateField = <K extends keyof EmployeeForm>(
    key: K,
    value: EmployeeForm[K],
  ) => {
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
      cuit: true,
      email: true,
      password: true,
      passwordConfirm: true,
      perfil: true,
    });

    if (!isFormValid) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error } = await createEmployeeAccount({
        email: form.email,
        password: form.password,
        nombres: form.nombres,
        apellidos: form.apellidos,
        dni: form.dni,
        cuil: form.cuit,
        perfil: form.perfil as ProfileRole,
        photoUri: form.photoUri,
      });

      if (error) {
        setFormError(error);
        return;
      }

      router.replace("/(app)/manager-home");
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "No pudimos dar de alta al empleado.";
      setFormError(message);
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
      cuit: parsed.cuil ?? current.cuit,
    }));
  };

  if (!allowed) {
    return null;
  }

  return (
    <AuthScreenLayout backHref="/(app)/manager-home">
      <View className="gap-3">
        <Text className="text-center text-lg font-bold text-neutral-900">
          Alta de empleado
        </Text>

        <AvatarCapture
          photoUri={form.photoUri}
          onPhotoChange={(uri) => updateField("photoUri", uri)}
        />

        
        <View className="gap-2">
          <Input
            label="DNI"
            placeholder="Escanee el DNI o ingrese los campos"
            value={form.dni}
            keyboardType="number-pad"
            error={touched.dni ? errors.dni : null}
            onBlur={() => markTouched("dni")}
            onChangeText={(value) =>
              updateField("dni", value.replace(/\D/g, ""))
            }
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
          <FormError message={qrError} onDismiss={() => setQrError(null)} />
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
          label="CUIT"
          placeholder="Ej: 20123456789"
          value={form.cuit}
          keyboardType="number-pad"
          error={touched.cuit ? errors.cuit : null}
          onBlur={() => markTouched("cuit")}
          onChangeText={(value) =>
            updateField("cuit", value.replace(/\D/g, ""))
          }
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

        <SelectPicker
          label="Perfil"
          value={form.perfil}
          options={[...EMPLOYEE_PROFILE_OPTIONS]}
          placeholder="Seleccioná el perfil del empleado"
          error={touched.perfil ? errors.perfil : null}
          onChange={(perfil) => {
            updateField("perfil", perfil);
            markTouched("perfil");
          }}
        />

        <FormError message={formError} onDismiss={() => setFormError(null)} />

        <Button
          title="Crear empleado"
          disabled={!isFormValid || isSubmitting}
          onPress={handleSubmit}
        />
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
