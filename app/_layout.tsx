import { supabase } from "@/lib/supabase";
import {
  Kodchasan_400Regular,
  Kodchasan_600SemiBold,
  Kodchasan_700Bold,
} from "@expo-google-fonts/kodchasan";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Kodchasan_400Regular,
    Kodchasan_600SemiBold,
    Kodchasan_700Bold,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Only redirect once we know who the user is and fonts are ready
    if (!isInitialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // No user? Go to login
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // User logged in? Go to main app
      router.replace("/(tabs)");
    }
  }, [session, segments, isInitialized, fontsLoaded, router]);

  // Keep Splash Screen visible until everything is ready
  if (!fontsLoaded || !isInitialized) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
