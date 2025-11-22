import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';

interface ProgressData {
  totalSessions: number;
  currentStreak: number;
  averageRPE: number;
  totalVolume: number;
  lastWorkoutDate: string | null;
  weeklyProgress: {
    week: string;
    sessions: number;
    volume: number;
  }[];
  muscleGroupStats: {
    name: string;
    frequency: number;
    lastTrained: string;
  }[];
}

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<ProgressData>({
    totalSessions: 0,
    currentStreak: 0,
    averageRPE: 0,
    totalVolume: 0,
    lastWorkoutDate: null,
    weeklyProgress: [],
    muscleGroupStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Intentar cargar datos reales del backend
      const [
        statsResponse,
        muscleGroupResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/users/1/stats`).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/users/1/muscle-group-frequency`).catch(() => ({ ok: false }))
      ]);

      let realProgressData: ProgressData = {
        totalSessions: 0,
        currentStreak: 0,
        averageRPE: 0,
        totalVolume: 0,
        lastWorkoutDate: null,
        weeklyProgress: [],
        muscleGroupStats: [],
      };

      // Cargar stats básicas si están disponibles
      if (statsResponse.ok && 'json' in statsResponse) {
        try {
          const stats = await statsResponse.json();
          realProgressData.totalSessions = stats.total_sessions || 0;
          realProgressData.currentStreak = stats.current_streak || 0;
          realProgressData.averageRPE = stats.average_rpe || 0;
          realProgressData.totalVolume = stats.total_volume_kg || 0;
          realProgressData.lastWorkoutDate = stats.last_workout_date;
        } catch {
          console.log('Error parseando stats');
        }
      }

      // Cargar stats de grupos musculares si están disponibles
      if (muscleGroupResponse.ok && 'json' in muscleGroupResponse) {
        try {
          const muscleGroups = await muscleGroupResponse.json();
          
          // Verificar que muscleGroups sea un array válido
          if (Array.isArray(muscleGroups) && muscleGroups.length > 0) {
            realProgressData.muscleGroupStats = muscleGroups.map((mg: any) => ({
              name: mg.muscle_group,
              frequency: mg.total_sessions,
              lastTrained: mg.last_trained_date,
            }));
          } else {
            console.log('muscleGroups no es un array válido:', muscleGroups);
            realProgressData.muscleGroupStats = [];
          }
        } catch {
          console.log('Error parseando muscle groups');
          realProgressData.muscleGroupStats = [];
        }
      }

      // Si tenemos datos reales, usarlos; si no, usar datos demo
      if (realProgressData.totalSessions > 0 || realProgressData.muscleGroupStats.length > 0) {
        // Agregar datos de progreso semanal demo ya que aún no tenemos endpoint
        realProgressData.weeklyProgress = [
          { week: 'Sem 1', sessions: Math.max(1, Math.floor(realProgressData.totalSessions * 0.2)), volume: Math.floor(realProgressData.totalVolume * 0.2) },
          { week: 'Sem 2', sessions: Math.max(1, Math.floor(realProgressData.totalSessions * 0.25)), volume: Math.floor(realProgressData.totalVolume * 0.25) },
          { week: 'Sem 3', sessions: Math.max(1, Math.floor(realProgressData.totalSessions * 0.15)), volume: Math.floor(realProgressData.totalVolume * 0.2) },
          { week: 'Sem 4', sessions: Math.max(1, Math.floor(realProgressData.totalSessions * 0.4)), volume: Math.floor(realProgressData.totalVolume * 0.35) },
        ];
        setProgressData(realProgressData);
        console.log('Datos de progreso cargados (mix backend + demo)');
      } else {
        throw new Error('No hay datos del backend disponibles');
      }
    } catch {
      console.log('Backend no disponible, usando datos demo');
      
      // Fallback a datos simulados
      setProgressData({
        totalSessions: 24,
        currentStreak: 5,
        averageRPE: 7.3,
        totalVolume: 12500,
        lastWorkoutDate: '2025-11-21',
        weeklyProgress: [
          { week: 'Sem 1', sessions: 3, volume: 2100 },
          { week: 'Sem 2', sessions: 4, volume: 2350 },
          { week: 'Sem 3', sessions: 3, volume: 2200 },
          { week: 'Sem 4', sessions: 4, volume: 2500 },
        ],
        muscleGroupStats: [
          { name: 'Pecho', frequency: 8, lastTrained: '2025-11-19' },
          { name: 'Espalda', frequency: 6, lastTrained: '2025-11-20' },
          { name: 'Piernas', frequency: 10, lastTrained: '2025-11-21' },
          { name: 'Hombros', frequency: 5, lastTrained: '2025-11-18' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const StatCard = ({ title, value, subtitle, color = '#22c55e' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ProgressBar = ({ percentage, color = '#22c55e' }: { percentage: number; color?: string }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando tu progreso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tu Progreso</Text>
          <Text style={styles.headerSubtitle}>
            Sigue así!
          </Text>
        </View>

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Sesiones" 
            value={progressData.totalSessions}
            subtitle="completadas"
          />
          <StatCard 
            title="Racha" 
            value={progressData.currentStreak}
            subtitle="días"
            color="#f59e0b"
          />
          <StatCard 
            title="RPE Promedio" 
            value={progressData.averageRPE.toFixed(1)}
            subtitle="intensidad"
            color="#3b82f6"
          />
          <StatCard 
            title="Volumen Total" 
            value={`${(progressData.totalVolume / 1000).toFixed(1)}k`}
            subtitle="kg movidos"
            color="#ef4444"
          />
        </View>

        {/* Weekly Progress Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Progreso Semanal</Text>
          <View style={styles.chartContainer}>
            {progressData.weeklyProgress.map((week, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: (week.sessions / 4) * 100,
                        backgroundColor: '#22c55e',
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartLabel}>{week.week}</Text>
                <Text style={styles.chartValue}>{week.sessions}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.muscleGroupSection}>
          <Text style={styles.sectionTitle}>Grupos Musculares</Text>
          {progressData.muscleGroupStats.map((muscle, index) => (
            <View key={index} style={styles.muscleCard}>
              <View style={styles.muscleInfo}>
                <Text style={styles.muscleName}>{muscle.name}</Text>
                <Text style={styles.muscleLastTrained}>
                  Último: {formatDate(muscle.lastTrained)}
                </Text>
              </View>
              <View style={styles.muscleStats}>
                <Text style={styles.muscleFrequency}>{muscle.frequency}</Text>
                <Text style={styles.muscleFrequencyLabel}>sesiones</Text>
              </View>
              <ProgressBar percentage={(muscle.frequency / 10) * 100} />
            </View>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/detailed-metrics')}
          >
            <Text style={styles.actionButtonText}>
              📊 Ver análisis detallado
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  chartSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  chartBar: {
    alignItems: 'center',
  },
  barContainer: {
    height: 100,
    width: 20,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 14,
    color: '#F9FAFB',
    fontWeight: '600',
  },
  muscleGroupSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  muscleCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  muscleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  muscleLastTrained: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  muscleStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  muscleFrequency: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginRight: 6,
  },
  muscleFrequencyLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#1f2937',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e33',
  },
  actionButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
});
