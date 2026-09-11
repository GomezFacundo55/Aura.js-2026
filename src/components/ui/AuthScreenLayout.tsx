import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { StatusBar, View, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


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
  const router = useRouter();

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
          <Pressable
            onPress={() => router.replace(backHref)}
            className={`mt-1 w-10 h-10 rounded-full bg-brand-500 border border-transparent items-center justify-center mr-3 shadow-sm`}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </Pressable>
        ) : null}

        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}
