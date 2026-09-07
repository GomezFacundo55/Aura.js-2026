import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { useToast } from '../../contextJ/Toast';
import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";

export default function App() {
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
        <View style={styles.container}>
        <Text>Aca va el home de mozo</Text>
        <StatusBar style="auto" />
        <TouchableOpacity
                activeOpacity={0.7}
                onPress={logOut}
                className="w-9 h-9 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm"
                >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        </View>

        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});