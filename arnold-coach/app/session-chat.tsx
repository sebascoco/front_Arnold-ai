import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { API_BASE_URL } from "../constants/api";
import { ChatMessage, ChatResponse } from "../constants/types";

const DEMO_USER_ID = 1;

interface WorkoutSet {
  id: number;
  exercise_id: number;
  exercise_order: number;
  set_number: number;
  target_reps: number;
  target_weight: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
  rpe: number | null;
  exercise?: {
    name: string;
    muscle_group: string;
  };
  auto_adjusted: boolean;
}

interface WorkoutSession {
  id: number;
  user_id: number;
  status: string;
  started_at?: string;
  finished_at?: string;
  sets: WorkoutSet[];
}

export default function SessionChatScreen() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    createAutoSession();
  }, []);

  const createAutoSession = async () => {
    try {
      setCreatingSession(true);
      const response = await fetch(`${API_BASE_URL}/sessions/auto?user_id=${DEMO_USER_ID}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error creando sesión");
      }

      const sessionData = await response.json();
      setSession(sessionData);

      // Mensaje inicial de Arnold
      const welcomeMessage: ChatMessage = {
        id: Date.now(),
        user_id: DEMO_USER_ID,
        session_id: sessionData.id,
        chat_type: "session",
        role: "arnold",
        text: `¡Perfecto! He creado tu rutina de hoy. Vamos a entrenar ${sessionData.sets?.[0]?.exercise?.muscle_group || 'varios grupos musculares'}. ¿Estás listo para comenzar?`,
        audio_url: null,
        timestamp: new Date().toISOString(),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la sesión de entrenamiento");
      console.error("Error creating session:", error);
    } finally {
      setCreatingSession(false);
    }
  };

  const finishSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${session.id}/finish`, {
        method: "POST",
      });

      if (response.ok) {
        Alert.alert(
          "¡Sesión completada! 🎉",
          "Excelente trabajo. Tu progreso ha sido guardado.",
          [
            {
              text: "Volver al chat general",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error finishing session:", error);
    }
  };

  const playAudioForMessage = async (message: ChatMessage) => {
    try {
      let audioPath = message.audio_url;

      if (!audioPath) {
        const resp = await fetch(`${API_BASE_URL}/tts/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message.text }),
        });

        if (!resp.ok) return;

        const data = await resp.json();
        audioPath = data.audio_url;
      }

      if (!audioPath) return;

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: `${API_BASE_URL}${audioPath}` });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log("Audio error:", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session) return;

    const localUserMessage: ChatMessage = {
      id: Date.now(),
      user_id: DEMO_USER_ID,
      session_id: session.id,
      chat_type: "session",
      role: "user",
      text: input,
      audio_url: null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localUserMessage]);
    const textToSend = input;
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: DEMO_USER_ID, 
          session_id: session.id,
          text: textToSend 
        }),
      });

      if (!resp.ok) {
        console.log("Backend error:", await resp.text());
        setLoading(false);
        return;
      }

      const data: ChatResponse = await resp.json();
      const arnoldMessage = data.message;

      setMessages((prev) => [...prev, arnoldMessage]);

      // Reproducir automáticamente el audio de Arnold
      await playAudioForMessage(arnoldMessage);

      // Actualizar la sesión para ver cambios en los pesos
      const sessionResp = await fetch(`${API_BASE_URL}/sessions/${session.id}`);
      if (sessionResp.ok) {
        const updatedSession = await sessionResp.json();
        setSession(updatedSession);
      }
    } catch (err) {
      console.log("Error sending:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.rowRight : styles.rowLeft,
        ]}
      >
        {!isUser && (
          <Image
            source={require("../assets/images/arnold.png")}
            style={styles.avatar}
          />
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleArnold,
          ]}
        >
          <Text
            style={[styles.text, isUser ? styles.textUser : styles.textArnold]}
          >
            {item.text}
          </Text>

          {!isUser && (
            <View style={styles.audioRow}>
              <TouchableOpacity
                onPress={() => playAudioForMessage(item)}
                style={styles.audioButton}
              >
                <Text style={styles.audioIcon}>▶</Text>
                <Text style={styles.audioText}>Escuchar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (creatingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Arnold está preparando tu rutina...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error al crear la sesión</Text>
          <TouchableOpacity style={styles.retryButton} onPress={createAutoSession}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sesión de Entrenamiento</Text>
          <Text style={styles.headerSubtitle}>
            Estado: {session.status === "planned" ? "Planeada" : 
                     session.status === "in_progress" ? "En progreso" : "Completada"}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={finishSession}
        >
          <Text style={styles.finishButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          ListHeaderComponent={() => (
            <View style={styles.workoutSummary}>
              <Text style={styles.summaryTitle}>Tu rutina de hoy:</Text>
              {session.sets.slice(0, 3).map((set, index) => (
                <Text key={index} style={styles.summaryItem}>
                  • {set.exercise?.name || `Ejercicio ${set.exercise_id}`} - {set.target_reps} reps
                  {set.target_weight && ` @ ${set.target_weight}kg`}
                </Text>
              ))}
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Cuéntale a Arnold cómo te sientes..."
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#020617",
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  finishButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  workoutSummary: {
    backgroundColor: "#111827",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e33",
  },
  summaryTitle: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryItem: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 4,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  messageRow: {
    marginBottom: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowRight: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: "#1f2937",
    borderTopRightRadius: 4,
  },
  bubbleArnold: {
    backgroundColor: "#0b1120",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#22c55e33",
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textUser: {
    color: "#e5e7eb",
  },
  textArnold: {
    color: "#f9fafb",
  },
  audioRow: {
    marginTop: 8,
    flexDirection: "row",
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  audioIcon: {
    color: "#fff",
    fontSize: 14,
    marginRight: 6,
  },
  audioText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#020617",
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  input: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#F9FAFB",
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#22c55e",
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 20,
  },
});
