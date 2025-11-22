import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const BG = "#020617";
const ACCENT = "#22d3ee";
const INACTIVE = "#64748b";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          borderRadius: 999,
          backgroundColor: "#020b1f",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#1e293b",
          height: 62,
        },
        tabBarShowLabel: false,

      }}>
      
      {/* Pantalla de Inicio/Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.centerButton,
                {
                  backgroundColor: focused ? ACCENT : "#020617",
                  shadowColor: ACCENT,
                },
              ]}
            >
              <Ionicons
                name={focused ? "mic" : "mic-outline"}
                size={26}
                color={focused ? "#020617" : ACCENT}
              />
            </View>
          ),
        }}
      />

      {/* Pantalla de Progreso/Stats */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Pantalla de Historial */}
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Pantalla de Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
  },
});