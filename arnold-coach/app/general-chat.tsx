import React, { useState } from "react";
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
} from "react-native";
import { Audio } from "expo-av";
import { API_BASE_URL } from "../constants/api";
import { ChatMessage, ChatResponse } from "../constants/types";

const DEMO_USER_ID = 1;

export default function GeneralChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const playAudioForMessage = async (message: ChatMessage) => {
    try {
      let audioPath = message.audio_url;

      // Fallback: si el mensaje no tiene audio_url, lo generamos al vuelo con /tts/test
      if (!audioPath) {
        const resp = await fetch(`${API_BASE_URL}/tts/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message.text }),
        });

        if (!resp.ok) {
          console.log("Error generando audio:", await resp.text());
          return;
        }

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
    if (!input.trim()) return;

    const localUserMessage: ChatMessage = {
      id: Date.now(),
      user_id: DEMO_USER_ID,
      session_id: null,
      chat_type: "general",
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
      const resp = await fetch(`${API_BASE_URL}/chat/general`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: DEMO_USER_ID, text: textToSend }),
      });

      if (!resp.ok) {
        console.log("Backend error:", await resp.text());
        setLoading(false);
        return;
      }

      const data: ChatResponse = await resp.json();
      const arnoldMessage = data.message;

      setMessages((prev) => [...prev, arnoldMessage]);

      // Reproducir automáticamente el audio de Arnold (o generarlo si no viene)
      await playAudioForMessage(arnoldMessage);
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
            source={require("../assets/images/arnold.png")} // asegúrate de tener esta imagen
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      {/* HEADER BONITO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/images/arnold.png")}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerTitle}>Arnold</Text>
            <Text style={styles.headerSubtitle}>Tu coach de gimnasio</Text>
          </View>
        </View>
        <View style={styles.headerTag}>
          <Text style={styles.headerTagText}>Online</Text>
        </View>
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
        />

        {/* Botón para ir a sesión de entrenamiento */}
        <View style={styles.sessionButtonContainer}>
          <TouchableOpacity
            style={styles.sessionButton}
            onPress={() => router.push("/session-chat")}
          >
            <Text style={styles.sessionButtonText}>
              🏋️ Iniciar sesión de entrenamiento
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Habla con Arnold..."
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
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
  headerTag: {
    marginLeft: "auto",
    backgroundColor: "#22c55e33",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  headerTagText: {
    color: "#22C55E",
    fontSize: 11,
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
    borderColor: "#1f2937",
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
    backgroundColor: "#2563eb",
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
  sessionButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sessionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
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
    backgroundColor: "#2563eb",
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
