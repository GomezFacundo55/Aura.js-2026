import { getMyProfile, signOut } from "@/lib/auth";
import { Stack, router, useNavigation } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK" || e.data.action.type === "POP") {
        e.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    getMyProfile().then(async (profile) => {
      if (String(profile?.estado ?? "").trim().toLowerCase() !== "pendiente") {
        return;
      }

      await signOut();
      router.replace({ pathname: "/(auth)/log-in", params: { pendiente: "1" } });
    });
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1, backgroundColor: "transparent" },
      }}
    />
  );
}
