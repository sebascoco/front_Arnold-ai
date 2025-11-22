import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ImageBackground,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "@/constants/api";

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
};

interface UserStats {
  totalSessions: number;
  currentStreak: number;
  averageRPE: number;
  lastWorkout: string | null;
}

const BG = "#020617";
const CARD = "#050b1f";
const TEXT_MUTED = "#9ca3af";
const TEXT_MAIN = "#f9fafb";
const ACCENT = "#22d3ee";
const ACCENT_ALT = "#a3ff12";
const SUCCESS = "#22c55e";

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "chat">("home");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Estoy listo. Cuéntame cómo te sientes hoy y ajusto la sesión.",
      role: "assistant",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    currentStreak: 0,
    averageRPE: 0,
    lastWorkout: null,
  });

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  // Efectos de animación del micrófono
  useEffect(() => {
    const createLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const l1 = createLoop(wave1, 0);
    const l2 = createLoop(wave2, 400);

    if (activeTab === "chat") {
      l1.start();
      l2.start();
    }

    return () => {
      l1.stop();
      l2.stop();
    };
  }, [wave1, wave2, activeTab]);

  // Cargar estadísticas del usuario
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
            totalSessions: 12,
            currentStreak: 5,
            averageRPE: 7.2,
            lastWorkout: "2024-01-15",
          });
        }
      } catch (e) {
        console.log("Error inicializando app:", e);
        // Usar datos demo como fallback
        setUserStats({
          totalSessions: 12,
          currentStreak: 5,
          averageRPE: 7.2,
          lastWorkout: "2024-01-15",
        });
      } finally {
        setLoadingStats(false);
      }
    };

    initializeApp();
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      role: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const botMsg: Message = {
      id: `${Date.now()}-bot`,
      text: "Perfecto. Lo guardo para ajustar la rutina de hoy.",
      role: "assistant",
    };
    setTimeout(() => setMessages((prev) => [...prev, botMsg]), 400);
  };

  const toggleListening = () => {
    setListening((prev) => !prev);
    // aquí luego metes grabación de audio + STT
  };

  const handleStartTodayWorkout = () => {
    router.push("/session-chat");
  };

  const handleOpenGeneralChat = () => {
    setActiveTab("chat");
  };

  const handleBackToHome = () => {
    setActiveTab("home");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
          { alignSelf: isUser ? "flex-end" : "flex-start" },
        ]}
      >
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    );
  };

  const waveStyle = (val: Animated.Value, size: number) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1,
    borderColor: `${ACCENT}55`,
    transform: [
      {
        scale: val.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1.6],
        }),
      },
    ],
    opacity: val.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    }),
  });

  if (loadingStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SUCCESS} />
          <Text style={styles.loadingText}>Inicializando Arnold...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Vista del Chat
  if (activeTab === "chat") {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          {/* Header del Chat */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={TEXT_MAIN} />
            </TouchableOpacity>
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatHeaderTitle}>Arnold Coach</Text>
              <Text style={styles.chatHeaderSubtitle}>Entrenador personal AI</Text>
            </View>
          </View>

          {/* HERO con foto + título grande */}
          <View style={styles.heroWrapper}>
            <ImageBackground
              source={require("@/assets/images/arnold.png")}
              resizeMode="cover"
              imageStyle={styles.heroImage}
              style={styles.heroImageWrapper}
            >
              <View style={styles.heroOverlay} />
            </ImageBackground>

            <View style={styles.heroTextBlock}>
              <Text style={styles.heroEyebrow}>ARNOLD • WORKOUT COACH</Text>
              <Text style={styles.heroTitle}>Train smarter, not harder.</Text>
              <Text style={styles.heroSubtitle}>
                Habla conmigo y construimos la mejor versión de tu cuerpo, serie
                a serie.
              </Text>
            </View>
          </View>

          {/* Tarjeta de micrófono + estado */}
          <View style={styles.voiceCard}>
            <View style={styles.voiceHeader}>
              <View>
                <Text style={styles.voiceTitle}>Arnold está listo</Text>
                <Text style={styles.voiceSubtitle}>
                  Mantén presionado para hablar o escríbeme abajo.
                </Text>
              </View>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: listening ? ACCENT : "#64748b" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {listening ? "Escuchando" : "En espera"}
                </Text>
              </View>
            </View>

            <View style={styles.micWrapper}>
              <Animated.View style={waveStyle(wave1, 170)} />
              <Animated.View style={waveStyle(wave2, 220)} />

              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.micButton,
                  listening && { backgroundColor: ACCENT_ALT },
                ]}
                onPress={toggleListening}
              >
                <Ionicons
                  name={listening ? "mic" : "mic-outline"}
                  size={34}
                  color={BG}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat */}
          <View style={styles.chatContainer}>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContainer}
            />
          </View>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Cuéntale a Arnold cómo dormiste, qué comiste..."
              placeholderTextColor={TEXT_MUTED}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={20} color={BG} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Vista del Home (por defecto)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Image
              source={require("@/assets/images/arnold.png")}
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
            <Text style={styles.buttonIcon}>🏋️‍♂️</Text>
            <Text style={styles.buttonText}>Entrenar ahora</Text>
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
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: TEXT_MAIN,
    fontSize: 16,
    marginTop: 16,
  },

  // Header Home
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
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_MUTED,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: TEXT_MAIN,
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
    color: SUCCESS,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  buttonPrimary: {
    backgroundColor: SUCCESS,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: SUCCESS,
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

  // Tips Section
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
    color: SUCCESS,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },

  // Chat Header
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    color: TEXT_MAIN,
    fontSize: 18,
    fontWeight: "600",
  },
  chatHeaderSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
  },

  // HERO Section (Chat)
  heroWrapper: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  heroImageWrapper: {
    width: 90,
    height: 120,
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 14,
  },
  heroImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroTextBlock: {
    flex: 1,
    justifyContent: "center",
  },
  heroEyebrow: {
    color: TEXT_MUTED,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroTitle: {
    color: TEXT_MAIN,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
  },

  // Voice Card
  voiceCard: {
    marginHorizontal: 18,
    marginTop: 6,
    padding: 16,
    borderRadius: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  voiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voiceTitle: {
    color: TEXT_MAIN,
    fontSize: 15,
    fontWeight: "600",
  },
  voiceSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#020b1f",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: TEXT_MUTED,
    fontSize: 11,
  },
  micWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 4,
    height: 170,
  },
  micButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },

  // Chat
  chatContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  messagesContainer: {
    paddingBottom: 12,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    maxWidth: "80%",
  },
  bubbleUser: {
    backgroundColor: "#0b1120",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  bubbleBot: {
    backgroundColor: "#020b1f",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  bubbleText: {
    color: TEXT_MAIN,
    fontSize: 14,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#1e293b",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "#020b1f",
    color: TEXT_MAIN,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT_ALT,
    alignItems: "center",
    justifyContent: "center",
  },
});