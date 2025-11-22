// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        {/* ESTA ES LA PANTALLA QUE CONTIENE LAS TABS */}
        <Stack.Screen
          name="(tabs)" // 👈 si tu carpeta se llama "tabs", pon: name="tabs"
          options={{ headerShown: false }}
        />

        {/* NUEVOS SCREENS FUERA DE LAS TABS */}
        <Stack.Screen
          name="general-chat"
          options={{ title: "Arnold - Chat general" }}
        />
        <Stack.Screen
          name="session-chat"
          options={{ title: "Arnold - Sesión de entrenamiento" }}
        />
        <Stack.Screen
          name="detailed-metrics"
          options={{ title: "Métricas Detalladas", headerShown: false }}
        />
      </Stack>
    </>
  );
}
