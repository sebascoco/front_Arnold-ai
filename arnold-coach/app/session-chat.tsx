import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { API_URL } from "../constants/api";

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
};

type PlanExercise = {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
};

type Session = {
  id: string;
  user_id: string;
  date: string;
  status: string;
  focus?: string;
  planned_exercises: PlanExercise[];
};

export default function SessionChatScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    arnoldIntro?: string;
    sessionJson?: string;
  }>();

  const sessionId = params.sessionId as string | undefined;
  const arnoldIntro = params.arnoldIntro as string | undefined;

  const initialSession: Session | null = useMemo(() => {
    if (!params.sessionJson) return null;
    try {
      return JSON.parse(params.sessionJson as string);
    } catch {
      return null;
    }
  }, [params.sessionJson]);

  const [session, setSession] = useState<Session | null>(initialSession);
  const [messages, setMessages] = useState<Message[]>(
    arnoldIntro
      ? [{ id: "intro", text: arnoldIntro, role: "assistant" }]
      : []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  if (!sessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "white", padding: 16 }}>
          No se encontró sesión. Vuelve a Home y crea una rutina de hoy.
        </Text>
      </SafeAreaView>
    );
  }

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      role: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "demo-user",
          message: trimmed,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status}`);
      }

      const data = await res.json();

      if (!data.reply) {
        throw new Error("Respuesta inválida del servidor");
      }

      if (data.updated_session) {
        setSession(data.updated_session);
      }

      const arnoldMessage: Message = {
        id: `arnold-${Date.now()}`,
        text: data.reply,
        role: "assistant",
      };

      setMessages((prev) => [...prev, arnoldMessage]);
    } catch (e) {
      console.error("Error en session-chat:", e);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Arnold se quedó sin aire. Intenta de nuevo.",
        role: "assistant",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Scroll automático al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleArnold,
        ]}
      >
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    );
  };

  const renderExerciseChip = ({ item }: { item: PlanExercise }) => {
    return (
      <View style={styles.exerciseChip}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseInfo}>
          {item.sets} x {item.reps} · {item.muscle_group}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>
            Enfoque: {session?.focus || "N/A"}
          </Text>
          <FlatList
            data={session?.planned_exercises || []}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseChip}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Cuéntale a Arnold cómo te fue en la serie..."
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Enviar</Text>
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
  sessionInfo: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: "#1e293b",
  },
  sessionTitle: {
    color: "#e5e7eb",
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    marginRight: 8,
  },
  exerciseName: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 13,
  },
  exerciseInfo: {
    color: "#9ca3af",
    fontSize: 11,
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 4,
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "80%",
  },
  bubbleUser: {
    backgroundColor: "#22c55e",
    alignSelf: "flex-end",
  },
  bubbleArnold: {
    backgroundColor: "#334155",
    alignSelf: "flex-start",
  },
  bubbleText: {
    color: "white",
  },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#020617",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#0f172a",
    color: "white",
    marginRight: 8,
  },
  sendButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
