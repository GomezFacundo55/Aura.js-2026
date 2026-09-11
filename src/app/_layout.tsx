import { GradientBackground } from "@/components/ui/GradientBackground";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";
import { ToastProvider } from "../contextJ/Toast";
import * as SplashScreen from "expo-splash-screen";
import CustomSplashScreen from "../components/CustomSplashScreen";
import { Asset } from "expo-asset";

SplashScreen.preventAutoHideAsync();

const LOGIN_IMAGES = [
  require("../../assets/images/LogoSazonNegro.png"),
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [mostrarSplash, setMostrarSplash] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      try {
        await Asset.loadAsync(LOGIN_IMAGES);
      } catch (error) {
        console.warn("Error precargando assets de login:", error);
      } finally {
        if (isMounted) setAssetsLoaded(true);
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  const appIsReady = fontsLoaded && assetsLoaded;

  // Ocultamos el splash NATIVO (el de Expo, previo a que corra JS) apenas
  // tenemos fuentes — a partir de acá el splash animado (CustomSplashScreen)
  // toma el control visual.
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {/* translucent={false}: la status bar no flota encima del contenido. */}
      <StatusBar style="dark" />
      <ToastProvider>
        <View className="flex-1">
          <GradientBackground />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { flex: 1, backgroundColor: "transparent" },
              animation: "fade",
              animationDuration: 180,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen
              name="(app)"
              options={{
                gestureEnabled: false,
                animation: "none",
              }}
            />
          </Stack>
        </View>

        {/*
          El Stack de arriba se monta SIEMPRE, en paralelo con el splash.
          Así, cuando el splash termina su animación y se retira, el login
          ya tuvo tiempo de montarse y pintarse por debajo — sin el "pop-in"
          de inputs/logo apareciendo tarde.
        */}
        {mostrarSplash && (
          <CustomSplashScreen
            appIsReady={appIsReady}
            onFinish={() => setMostrarSplash(false)}
          />
        )}
      </ToastProvider>
    </SafeAreaProvider>
  );
}