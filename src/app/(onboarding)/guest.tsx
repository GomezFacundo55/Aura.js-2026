import { AuthScreenLayout } from "../../components/ui/AuthScreenLayout";
import { AvatarCapture } from "../../components/ui/AvatarCapture";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { validateGuestName } from "../../lib/validation";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

export default function GuestScreen() {
    const [name, setName] = useState("");
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const nameError = useMemo(() => validateGuestName(name), [name]);
    const isFormValid = nameError === null;

    const handleContinue = () => {
        setTouched(true);

        if (!isFormValid) {
        return;
        }

        // TODO: guardar datos temporales del invitado (nombre, foto) en Supabase o almacenamiento local.
        router.replace("/(app)/home");
    };

    return (
        <AuthScreenLayout>        
        <View className="gap-6">
            <AvatarCapture photoUri={photoUri} onPhotoChange={setPhotoUri} />

            <Input
            label="Nombre"
            placeholder="Ej: Juan"
            value={name}
            autoCapitalize="words"
            autoCorrect={false}
            error={touched ? nameError : null}
            onBlur={() => setTouched(true)}
            onChangeText={setName}
            />

            <Button title="Continuar" disabled={!isFormValid} onPress={handleContinue} />

            <Link href="/" asChild>
            <Text className="text-center text-sm text-neutral-600 underline">
                Volver al inicio
            </Text>
            </Link>
        </View>
        </AuthScreenLayout>
    );
}
