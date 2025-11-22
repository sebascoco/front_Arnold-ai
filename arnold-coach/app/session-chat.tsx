// app/session-chat.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import { API_BASE_URL } from "../constants/api";
import { ChatMessage, ChatResponse, WorkoutSession, WorkoutSet } from "../constants/types";

const DEMO_USER_ID = 1;

export default function SessionChatScreen() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);
  const [sending, setSending] = useState(false);

  const playAudioIfAny = async (audioUrl?: string | null) => {
    if (!audioUrl) return;
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: `${API_BASE_URL}${audioUrl}` });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log("Error reproduciendo audio:", e);
    }
  };

  const loadSession = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/sessions/auto?user_id=${DEMO_USER_ID}`, {
        method: "POST",
      });
      if (!resp.ok) {
        console.log("Error creando sesión:", await resp.text());
        return;
      }
      const data: WorkoutSession = await resp.json();
      setSession(data);

      // Mensaje inicial de Arnold presentando la rutina (opcional lo puedes generar desde el back)
      const introMsg: ChatMessage = {
        id: Date.now(),
        user_id: DEMO_USER_ID,
        session_id: data.id,
        chat_type: "session",
        role: "arnold",
        text: "Empezamos esta sesión. Te propongo esta rutina, avísame cómo te vas sintiendo en cada ejercicio.",
        audio_url: null,
        timestamp: new Date().toISOString(),
      };
      setMessages([introMsg]);
    } catch (err) {
      console.log("Error loadSession:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !session) return;
    const textToSend = input;

    const userMsg: ChatMessage = {
      id: Date.now(),
      user_id: DEMO_USER_ID,
      session_id: session.id,
      chat_type: "session",
      role: "user",
      text: textToSend,
      audio_url: null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: DEMO_USER_ID,
          session_id: session.id,
          text: textToSend,
        }),
      });

      if (!resp.ok) {
        console.log("Error en chat/session:", await resp.text());
        setSending(false);
        return;
      }

      const data: ChatResponse = await resp.json();
      const arnoldMsg = data.message;
      setMessages((prev) => [...prev, arnoldMsg]);
      playAudioIfAny(arnoldMsg.audio_url);

      // opcional: recargar la sesión para ver si cambió pesos/reps
      const sessResp = await fetch(`${API_BASE_URL}/sessions/${session.id}`);
      if (sessResp.ok) {
        const updated: WorkoutSession = await sessResp.json();
        setSession(updated);
      }
    } catch (err) {
      console.log("Error sendMessage session:", err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.bubble,
        item.role === "user" ? styles.userBubble : styles.arnoldBubble,
      ]}
    >
      <Text style={styles.role}>{item.role === "user" ? "Tú" : "Arnold"}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  const renderSet = (set: WorkoutSet) => (
    <View key={set.id} style={styles.setRow}>
      <Text style={styles.setText}>
        Ejercicio #{set.exercise_order} · Serie {set.set_number} · Objetivo:{" "}
        {set.target_reps} reps
        {set.target_weight ? ` @ ${set.target_weight} kg` : ""}
        {set.auto_adjusted ? " (ajustado por Arnold)" : ""}
      </Text>
    </View>
  );

  if (loadingSession || !session) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: "#fff", marginTop: 8 }}>Creando sesión con Arnold...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumen rápido de la sesión */}
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>Sesión #{session.id}</Text>
        <Text style={styles.sessionSubtitle}>Rutina propuesta:</Text>
        {session.sets.map(renderSet)}
      </View>

      {/* Chat */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Cuéntale a Arnold cómo te fue..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
        />
        <Button title={sending ? "..." : "Enviar"} onPress={sendMessage} disabled={sending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  bubble: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: "#1f2933",
    alignSelf: "flex-end",
  },
  arnoldBubble: {
    backgroundColor: "#111827",
    alignSelf: "flex-start",
  },
  role: {
    fontSize: 10,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  text: {
    color: "#F9FAFB",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#111827",
    backgroundColor: "#020617",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4B5563",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#F9FAFB",
    marginRight: 8,
  },
  sessionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#111827",
  },
  sessionTitle: { color: "#F9FAFB", fontSize: 18, fontWeight: "600" },
  sessionSubtitle: { color: "#9CA3AF", marginTop: 4, marginBottom: 8 },
  setRow: { marginBottom: 4 },
  setText: { color: "#E5E7EB", fontSize: 12 },
});
