// app/(tabs)/index.tsx   ← o app/tabs/index.tsx según tu estructura
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";

export default function HomeScreen() {
  const router = useRouter();
  const [loadingRoutine, setLoadingRoutine] = useState(false);

  // Seteamos usuario demo al entrar
  useEffect(() => {
    const setupUser = async () => {
      try {
        await fetch(`${API_URL}/user/setup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "demo-user",
            name: "Ranch",
            age: 21,
            height_cm: 175,
            weight_kg: 70,
            experience_level: "intermediate",
            goal: "hypertrophy",
            training_days_per_week: 4,
          }),
        });
      } catch (e) {
        console.log("Error seteando usuario:", e);
      }
    };

    setupUser();
  }, []);

  const handleOpenGeneralChat = () => {
    router.push("/general-chat");
  };

  const handleStartTodayWorkout = async () => {
    try {
      setLoadingRoutine(true);
      const res = await fetch(`${API_URL}/routine/today`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "demo-user" }),
      });

      if (!res.ok) throw new Error("Error al pedir rutina");

      const data = await res.json();

      router.push({
        pathname: "/session-chat",
        params: {
          sessionId: data.session.id,
          arnoldIntro: data.message_from_arnold,
          sessionJson: JSON.stringify(data.session),
        },
      });
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo generar la rutina de hoy.");
    } finally {
      setLoadingRoutine(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hola, soy Arnold 💪</Text>
      <Text style={styles.subtitle}>
        ¿Quieres hablar de nutrición o recuperación, o arrancamos con el entrenamiento?
      </Text>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={handleOpenGeneralChat}
      >
        <Text style={styles.buttonText}>Chat general con Arnold</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={handleStartTodayWorkout}
        disabled={loadingRoutine}
      >
        {loadingRoutine ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Empezar entrenamiento de hoy</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>MVP Hackatón 🔥</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5f5",
    marginBottom: 24,
  },
  buttonPrimary: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    marginTop: "auto",
  },
  footerText: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },
});