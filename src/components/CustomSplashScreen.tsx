import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const INTEGRANTES = [
    "Delgobbo Giuliana",
    "Gómez Facundo",
    "Jauregui Enzo",
    "Almonacid Emir",
];

type Props = { onFinish: () => void };

export default function CustomSplashScreen({ onFinish }: Props) {
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const nombresAnim = useRef(
        INTEGRANTES.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        Animated.sequence([
        Animated.parallel([
            Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
            }),
        ]),
        Animated.stagger(
            150,
            nombresAnim.map((anim) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
            )
        ),
        ]).start(() => {
        setTimeout(onFinish, 700); // pausa antes de pasar a la app
        });
    }, []);

    return (
        <View className="flex-1">
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

            <View className="flex-1 items-center justify-center px-6">
                <Animated.Image
                    source={require("../../assets/images/splash-icon.png")}
                    style={{
                        width: 140,
                        height: 140,
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    }}
                    resizeMode="contain"
                />

                <View className="mt-10 items-center">
                    {INTEGRANTES.map((nombre, i) => (
                        <Animated.Text
                            key={nombre}
                            className="text-white text-3xl font-semibold mb-2"
                            style={{
                                opacity: nombresAnim[i],
                                transform: [
                                {
                                    translateY: nombresAnim[i].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [15, 0],
                                    }),
                                },
                                ],
                            }}
                            >
                            {nombre}
                        </Animated.Text>
                    ))}
                </View>
            </View>
        </View>
    );
}