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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
};

const BG = "#020617";
const CARD = "#050b1f";
const TEXT_MUTED = "#9ca3af";
const TEXT_MAIN = "#f9fafb";
const ACCENT = "#22d3ee";   // neon azul
const ACCENT_ALT = "#a3ff12"; // toque más tipo imagen que mandaste

export default function VoiceChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Estoy listo. Cuéntame cómo te sientes hoy y ajusto la sesión.",
      role: "assistant",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

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

    l1.start();
    l2.start();

    return () => {
      l1.stop();
      l2.stop();
    };
  }, [wave1, wave2]);

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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {/* HERO con foto + título grande */}
        <View style={styles.heroWrapper}>
          <ImageBackground
            // TODO: cambia esto por tu imagen real, por ejemplo:
            // source={require("../../assets/gym-hero.jpg")}
            //source={require("../../assets/placeholder.png")}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  /* HERO */
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

  /* Tarjeta micrófono */
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

  /* Chat */
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

  /* Input */
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