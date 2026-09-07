import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from "react-native";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { useToast } from '../../contextJ/Toast';
import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";

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
    
  return (
    <View className="flex-1 px-6 pt-16">
      <TouchableOpacity
                activeOpacity={0.7}
                onPress={logOut}
                className="w-9 h-9 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm"
                >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <Text className="text-2xl font-bold text-neutral-900">Bienvenido a Foodly</Text>
      <Text className="mt-3 text-base text-neutral-600">
        Acá vas a poder ver el menú del restaurante y hacer tu pedido.
      </Text>
      <View className="mt-8 flex-1 items-center justify-center rounded-2xl border border-dashed border-neutral-400 bg-surface-light p-6">
        <Text className="text-center text-neutral-500">
          Espacio reservado para el menú del restaurante
        </Text>
      </View>
    </View>
  );
}