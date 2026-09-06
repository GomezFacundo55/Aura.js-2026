import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { StatusBar, View } from "react-native";
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
  backHref = "/(auth)/log-in",
}: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0);

  return (
    <View className="flex-1 bg-transparent">
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        extraHeight={80}
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: topInset + 4,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {showBack ? (
          <Link href={backHref} className="text-base font-semibold text-brand-600" style={{ marginBottom: 25 }}>
            ← Volver
          </Link>
        ) : null}

        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}
