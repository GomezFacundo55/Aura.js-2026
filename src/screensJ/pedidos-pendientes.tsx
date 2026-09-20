import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function PedidosPendientesScreen(){
    const perfil = useLocalSearchParams();
    return (
        <View>
            <Text>pedidos pendientes</Text>
        </View>
    )
}