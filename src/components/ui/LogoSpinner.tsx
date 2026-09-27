import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

type Props = {
  mensaje?: string;
  tamaño?: number;
};

export default function LogoSpinner({ mensaje, tamaño = 110 }: Props) {
  const giro = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animGiro = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const animPulso = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    animGiro.start();
    animPulso.start();
    return () => {
      animGiro.stop();
      animPulso.stop();
    };
  }, [giro, pulso]);

  const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const anillo = tamaño + 34;

  return (
    <View className="items-center justify-center">
      <View style={{ width: anillo, height: anillo }} className="items-center justify-center">
        <Animated.View
          style={{
            position: "absolute",
            width: anillo,
            height: anillo,
            borderRadius: anillo / 2,
            borderWidth: 5,
            borderColor: "#FFD8B5",
            borderTopColor: "#FF6B00",
            transform: [{ rotate }],
          }}
        />
        <Animated.Image
          source={require("../../../assets/images/LogoSazonNegro.png")}
          style={{ width: tamaño, height: tamaño, transform: [{ scale: pulso }] }}
          resizeMode="contain"
        />
      </View>
      {mensaje ? (
        <Text className="mt-4 text-lg font-bold text-[#1E2342] text-center">{mensaje}</Text>
      ) : null}
    </View>
  );
}
