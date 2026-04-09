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
// ADD THIS IMPORT
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized || !fontsLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, isInitialized, fontsLoaded, router]);

  if (!fontsLoaded || !isInitialized) return null;

  return (
    <SafeAreaProvider>
      {/* This View wrapper ensures the layout occupies the full screen hit-area */}
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)/login" />
        </Stack>
      </View>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
