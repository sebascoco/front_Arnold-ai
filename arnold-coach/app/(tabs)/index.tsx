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

interface UserProfile {
  id: number;
  name: string;
  weight_kg?: number;
  height_cm?: number;
  experience_level?: string;
  goal?: string;
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
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 1,
    name: "Champion",
  });

  // Setup inicial y cargar stats
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Setup inicial del usuario y ejercicios
        await fetch(`${API_BASE_URL}/setup/seed`, {
          method: "POST",
        });

        // Cargar perfil del usuario
        const profileResponse = await fetch(`${API_BASE_URL}/users/1`).catch(() => ({ ok: false }));
        if (profileResponse.ok && 'json' in profileResponse) {
          try {
            const profile = await profileResponse.json();
            setUserProfile({
              id: profile.id,
              name: profile.name || "Champion",
              weight_kg: profile.weight_kg,
              height_cm: profile.height_cm,
              experience_level: profile.experience_level,
              goal: profile.goal,
            });
            console.log('Perfil del usuario cargado desde el backend');
          } catch {
            console.log('Error parseando perfil del usuario');
            setUserProfile({
              id: 1,
              name: "Champion",
              weight_kg: 75.5,
              height_cm: 175,
              experience_level: "intermedio",
              goal: "ganar_fuerza",
            });
          }
        } else {
          console.log("Backend no disponible, usando perfil demo");
          setUserProfile({
            id: 1,
            name: "Champion",
            weight_kg: 75.5,
            height_cm: 175,
            experience_level: "intermedio",
            goal: "ganar_fuerza",
          });
        }

        // Cargar stats reales del usuario
        const statsResponse = await fetch(`${API_BASE_URL}/users/1/stats`).catch(() => ({ ok: false }));
        if (statsResponse.ok && 'json' in statsResponse) {
          try {
            const realStats = await statsResponse.json();
            setUserStats({
              totalSessions: realStats.total_sessions || 0,
              currentStreak: realStats.current_streak || 0,
              averageRPE: realStats.average_rpe || 0,
              lastWorkout: realStats.last_workout_date || null,
            });
            console.log('Stats del usuario cargadas desde el backend');
          } catch {
            console.log('Error parseando stats del usuario');
          }
        } else {
          console.log("Stats no disponibles, usando valores por defecto");
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

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Bajo peso";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Sobrepeso";
    return "Obesidad";
  };

  const getExperienceEmoji = (level?: string): string => {
    switch (level?.toLowerCase()) {
      case 'principiante': return '🌱';
      case 'intermedio': return '💪';
      case 'avanzado': return '🏆';
      default: return '💪';
    }
  };

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
              <Text style={styles.title}>¡Hola, {userProfile.name}!</Text>
              <Text style={styles.subtitle}>
                {userProfile.height_cm ? `${userProfile.height_cm}cm • ` : ''}
                {userProfile.weight_kg && userProfile.height_cm 
                  ? `${getBMICategory(calculateBMI(userProfile.weight_kg, userProfile.height_cm))} • `
                  : ''
                }
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
              <Text style={styles.statNumber}>
                {userProfile.weight_kg ? `${userProfile.weight_kg}kg` : '---'}
              </Text>
              <Text style={styles.statLabel}>Peso actual</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {getExperienceEmoji(userProfile.experience_level)}
              </Text>
              <Text style={styles.statLabel}>
                {userProfile.experience_level ? 
                  userProfile.experience_level.charAt(0).toUpperCase() + userProfile.experience_level.slice(1) 
                  : 'Nivel actual'
                }
              </Text>
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