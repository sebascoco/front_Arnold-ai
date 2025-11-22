// app/(tabs)/index.tsx   ← o app/tabs/index.tsx según tu estructura
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../constants/api";

interface UserStats {
  totalSessions: number;
  currentStreak: number;
  averageRPE: number;
  lastWorkout: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const [loadingStats, setLoadingStats] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    currentStreak: 0,
    averageRPE: 0,
    lastWorkout: null,
  });

  // Setup inicial y cargar stats
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Setup inicial del usuario y ejercicios
        await fetch(`${API_BASE_URL}/setup/seed`, {
          method: "POST",
        });

        // Cargar stats reales del usuario
        const statsResponse = await fetch(`${API_BASE_URL}/users/1/stats`);
        if (statsResponse.ok) {
          const realStats = await statsResponse.json();
          setUserStats({
            totalSessions: realStats.total_sessions || 0,
            currentStreak: realStats.current_streak || 0,
            averageRPE: realStats.average_rpe || 0,
            lastWorkout: realStats.last_workout_date || null,
          });
        } else {
          // Fallback a datos demo si no hay stats reales
          setUserStats({
            totalSessions: 0,
            currentStreak: 0,
            averageRPE: 0,
            lastWorkout: null,
          });
        }
      } catch (e) {
        console.log("Error inicializando app:", e);
        // Usar datos demo como fallback
        setUserStats({
          totalSessions: 0,
          currentStreak: 0,
          averageRPE: 0,
          lastWorkout: null,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    initializeApp();
  }, []);

  const handleOpenGeneralChat = () => {
    router.push("/general-chat");
  };

  const handleStartTodayWorkout = () => {
    router.push("/session-chat");
  };

  if (loadingStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Inicializando Arnold...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Image
              source={require("../../assets/images/arnold.png")}
              style={styles.arnoldImage}
            />
            <View style={styles.welcomeText}>
              <Text style={styles.title}>¡Hola, Champion!</Text>
              <Text style={styles.subtitle}>
                Arnold está listo para entrenar contigo
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Tu progreso</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sesiones completadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Racha actual</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.averageRPE.toFixed(1)}</Text>
              <Text style={styles.statLabel}>RPE promedio</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>💪</Text>
              <Text style={styles.statLabel}>Nivel actual</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleStartTodayWorkout}
          >
            <>
              <Text style={styles.buttonIcon}>🏋️‍♂️</Text>
              <Text style={styles.buttonText}>Entrenar ahora</Text>
            </>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleOpenGeneralChat}
          >
            <Text style={styles.buttonIcon}>💬</Text>
            <Text style={styles.buttonText}>Chat con Arnold</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tip del día</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              La consistencia vence a la perfección. Mejor una sesión corta que ninguna sesión.
            </Text>
            <Text style={styles.tipAuthor}>- Arnold</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#F9FAFB",
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  arnoldImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#22c55e",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  buttonPrimary: {
    backgroundColor: "#22c55e",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#22c55e",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonSecondary: {
    backgroundColor: "#111827",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e33",
  },
  tipText: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 8,
  },
  tipAuthor: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
});