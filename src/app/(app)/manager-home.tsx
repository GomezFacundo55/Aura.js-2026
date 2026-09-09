import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { Button } from "@/components/ui/Button";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { isManagerRole } from "@/lib/validation";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useToast } from '../../contextJ/Toast';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const logOut = async () => {
        const { error } = await signOut();
        if (error) {
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
        <AuthScreenLayout showBack={false}>
            <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-neutral-900">Panel de gestión</Text>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={logOut}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-danger shadow-sm"
                >
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {profile ? (
                <Text className="mt-2 text-sm text-neutral-500">Rol: {profile.perfil}</Text>
            ) : null}

            {canManageStaff ? (
                <View className="mt-8 gap-3">
                    <Link href="/(app)/alta-empleado" asChild>
                        <Button title="Alta de empleado" />
                    </Link>
                    <Link href="/mesas/nueva" asChild>
                        <Button title="Agregar mesa" variant="primary" />
                    </Link>
                    <Link href="/mesas" asChild>
                        <Button title="Ver listado de mesas" variant="primary" />
                    </Link>
                    <Link href="/clientes/pendientes" asChild>
                        <Button title="Clientes pendientes" variant="primary" />
                    </Link>
                </View>
            ) : null}
        </AuthScreenLayout>
    );
}