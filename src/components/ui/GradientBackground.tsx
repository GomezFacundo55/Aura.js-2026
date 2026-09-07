import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

export function GradientBackground() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <LinearGradient
        colors={["#FFC2AD", "#FF9C7A", "#FF7A4D"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="absolute inset-0"
      />
      <View
        className="absolute top-15 -right-5 h-80 w-80 rounded-full bg-brand-50 opacity-30"
        pointerEvents="none"
      />
      <View
        className="absolute top-140 -left-13 h-72 w-72 rounded-full bg-brand-50 opacity-25"
        pointerEvents="none"
      />
    </View>
  );
}
