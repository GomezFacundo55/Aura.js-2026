import { AuthScreenLayout } from "../../components/ui/AuthScreenLayout";
import { AvatarCapture } from "../../components/ui/AvatarCapture";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { validateGuestName } from "../../lib/validation";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, View } from "react-native";
import { signInAnonymouslyWithProfile } from "@/lib/auth";
import { useToast } from "@/contextJ/Toast";
import { SoundService } from "@/servicesJ/soundService";

export default function GuestScreen() {
    const {showToast} = useToast();
    const [name, setName] = useState("");
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const nameError = useMemo(() => validateGuestName(name), [name]);
    const isFormValid = nameError === null && photoUri !== null;

    const handleContinue = async () => {
        setTouched(true);

        if (!isFormValid) {
        return;
        }
        try{
            const { error } = await signInAnonymouslyWithProfile({nombres:name, photoUri:photoUri})
            if(error){
                console.log(error)
                showToast('error', "Error al ingresar", error);
                SoundService.reproducir('error');
                return;
            }
            router.replace("/(app)/home");
        } catch(er) {
            showToast('error', 'Error al inesperado.', `${er}`)
        }
    };

    return (
        <AuthScreenLayout>    
        <View className="mt-15 items-center" style={{ marginBottom: 100 }}>
            <Image
                accessibilityLabel="Logo de Sazon"
                source={require("../../../assets/images/LogoSazonNegro.png")}
                style={{ width: 400, height: 104 }}
                resizeMode="contain"
            />
        </View>    
        <View className="gap-4">
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

        </View>
        </AuthScreenLayout>
    );
}
