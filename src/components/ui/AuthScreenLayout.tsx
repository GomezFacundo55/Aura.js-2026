import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  StatusBar,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthScreenLayoutProps = {
  children: ReactNode;
  showBack?: boolean;
  backHref?: Href;
};

export function AuthScreenLayout({
  children,
  showBack = true,
  backHref = "/",
}: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  // Fallback por si el inset aún no llegó (pasa en Android sin provider o con status bar translucida).
  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F6" }}>
      <KeyboardAvoidingView
        behavior="height"
        keyboardVerticalOffset={topInset}
        style={{ flex: 1 }}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraHeight={80}
          extraScrollHeight={24}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: topInset + 8,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {showBack ? (
            <Link href={backHref} className="mt-2 text-base font-medium text-brand-600">
              ← Volver
            </Link>
          ) : null}

          <View className="mb-8 mt-4 items-center">
            <Image
              accessibilityLabel="Logo de Foodly"
              source={require("../../../assets/images/LogoFoodlyNegro.png")}
              style={{ width: 208, height: 56 }}
              resizeMode="contain"
            />
          </View>

          {children}
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
