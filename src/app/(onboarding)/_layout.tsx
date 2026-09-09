import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1, backgroundColor: "transparent" },
        animation: "fade",
        animationDuration: 180,
      }}
    />
  );
}
