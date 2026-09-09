import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import type { Href } from "expo-router";
import { resolveHomeRoute } from "@/lib/auth";

export default function DashboardRoute() {
  const [route, setRoute] = useState<Href | null>(null);

  useEffect(() => {
    resolveHomeRoute().then((result) => {
      if (result.pending) {
        setRoute("/(auth)/log-in");
        return;
      }
      setRoute(result.route ?? "/(app)/home");
    });
  }, []);

  if (!route) {
    return null;
  }

  return <Redirect href={route} />;
}
