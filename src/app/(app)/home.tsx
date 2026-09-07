import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-surface-muted px-6 pt-16">
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