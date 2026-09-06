import { Button } from "@/components/ui/Button";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { isManagerRole } from "@/lib/validation";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useToast } from '../../contextJ/Toast';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const logOut = async()=>{
        const { error } = await signOut();
        if(error){
            showToast("error", "Error", "Error al cerrar sesión")
        } else {
            router.replace("/log-in");
        }
    }

    useEffect(() => {
        getMyProfile().then(setProfile);
    }, []);

    const canManageStaff = isManagerRole(profile?.perfil);

    return (
        <View className="flex-1 px-6 pt-16">
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={logOut}
                className="w-9 h-9 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm"
                >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            {canManageStaff ? (
                <View className="mt-6 gap-3">
                    <Link href="/(app)/alta-empleado" asChild>
                        <Button title="Alta de empleado" />
                    </Link>
                    <Link href="/mesas/nueva" asChild>
                        <Button title="Agregar mesa" variant="primary" />
                    </Link>
                    <Link href="/mesas" asChild>
                        <Button title="Ver listado de mesas" variant="secondary" />
                    </Link>
                    <Link href="/clientes/pendientes" asChild>
                        <Button title="Clientes pendientes" variant="primary" />
                    </Link>
                </View>
            ) : null}
        </View>
    );
}