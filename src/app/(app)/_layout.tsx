import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { Stack, router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useChatNotifications } from "@/hooks/useChatNotifications";

export default function AppLayout() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useChatNotifications(profile);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK" || e.data.action.type === "POP") {
        e.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    getMyProfile().then(async (p) => {
      setProfile(p);
      if (String(p?.estado ?? "").trim().toLowerCase() !== "pendiente") {
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
