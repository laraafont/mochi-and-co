import React from "react";

import {
  Kodchasan_400Regular,
  Kodchasan_600SemiBold,
  Kodchasan_700Bold,
} from "@expo-google-fonts/kodchasan";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Kodchasan_400Regular,
    Kodchasan_600SemiBold,
    Kodchasan_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack>
        {/* main tab navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
