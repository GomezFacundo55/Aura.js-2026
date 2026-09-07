import { Button } from "@/components/ui/Button";
import { getMyProfile, type UserProfile } from "@/lib/auth";
import { isManagerRole } from "@/lib/validation";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function HomeScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        getMyProfile().then(setProfile);
    }, []);

    const canManageStaff = isManagerRole(profile?.perfil);

    return (
        <View className="flex-1 bg-surface-muted px-6 pt-16">
            {profile ? (
                <Text className="mt-2 text-sm text-neutral-500">Rol: {profile.perfil}</Text>
            ) : null}

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