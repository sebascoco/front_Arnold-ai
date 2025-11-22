import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '../constants/api';

interface DetailedMetrics {
  totalWorkouts: number;
  averageWorkoutDuration: number;
  totalVolumeLifted: number;
  strengthProgression: {
    exercise: string;
    initialWeight: number;
    currentWeight: number;
    improvement: number;
  }[];
  weeklyConsistency: {
    week: string;
    completedDays: number;
    targetDays: number;
  }[];
  muscleGroupAnalysis: {
    name: string;
    totalSets: number;
    averageRPE: number;
    lastTrained: string;
    strength: 'fuerte' | 'moderado' | 'débil';
  }[];
  monthlyProgress: {
    month: string;
    workouts: number;
    volume: number;
    avgRPE: number;
  }[];
}

export default function DetailedMetricsScreen() {
  const [metrics, setMetrics] = useState<DetailedMetrics>({
    totalWorkouts: 0,
    averageWorkoutDuration: 0,
    totalVolumeLifted: 0,
    strengthProgression: [],
    weeklyConsistency: [],
    muscleGroupAnalysis: [],
    monthlyProgress: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fuerza' | 'volumen' | 'consistencia'>('fuerza');

  useEffect(() => {
    loadDetailedMetrics();
  }, []);

  const loadDetailedMetrics = async () => {
    try {
      // Intentar cargar datos reales del backend
      const [
        statsResponse,
        strengthResponse,
        consistencyResponse,
        muscleGroupResponse,
        volumeResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/users/1/stats`),
        fetch(`${API_BASE_URL}/users/1/strength-progression`),
        fetch(`${API_BASE_URL}/users/1/consistency-analysis`),
        fetch(`${API_BASE_URL}/users/1/muscle-group-frequency`),
        fetch(`${API_BASE_URL}/users/1/volume-analysis`)
      ]);

      if (statsResponse.ok && strengthResponse.ok && consistencyResponse.ok && 
          muscleGroupResponse.ok && volumeResponse.ok) {
        // Si todos los endpoints responden correctamente, usar datos reales
        const statsData = await statsResponse.json();
        const strengthData = await strengthResponse.json();
        const consistencyData = await consistencyResponse.json();
        const muscleGroupData = await muscleGroupResponse.json();
        const volumeData = await volumeResponse.json();

        setMetrics({
          totalWorkouts: statsData.total_sessions || 0,
          averageWorkoutDuration: Math.round(statsData.average_duration_minutes || 0),
          totalVolumeLifted: Math.round(statsData.total_volume_kg || 0),
          strengthProgression: strengthData.map((item: any) => ({
            exercise: item.exercise_name,
            initialWeight: item.initial_weight,
            currentWeight: item.current_weight,
            improvement: item.improvement_percentage,
          })) || [],
          weeklyConsistency: consistencyData.map((item: any) => ({
            week: item.week_label,
            completedDays: item.completed_days,
            targetDays: item.target_days,
          })) || [],
          muscleGroupAnalysis: muscleGroupData.map((item: any) => ({
            name: item.muscle_group,
            totalSets: item.total_sets,
            averageRPE: parseFloat(item.average_rpe?.toFixed(1) || '0'),
            lastTrained: item.last_trained_date,
            strength: item.average_rpe <= 7.0 ? 'fuerte' : 
                     item.average_rpe <= 8.5 ? 'moderado' : 'débil' as 'fuerte' | 'moderado' | 'débil',
          })) || [],
          monthlyProgress: volumeData.map((item: any) => ({
            month: item.month_number === '09' ? 'Sep' :
                   item.month_number === '10' ? 'Oct' :
                   item.month_number === '11' ? 'Nov' : 
                   item.month_number === '12' ? 'Dic' : 
                   `M${item.month_number}`,
            workouts: item.workouts_count,
            volume: Math.round(item.total_volume || 0),
            avgRPE: parseFloat(item.avg_rpe?.toFixed(1) || '0'),
          })) || [],
        });

        console.log('Métricas detalladas cargadas desde el backend');
      } else {
        throw new Error('API endpoints no disponibles');
      }
    } catch {
      console.log('Backend no disponible, usando datos demo para métricas detalladas');
      
      // Fallback a datos demo si el backend no está disponible
      setMetrics({
        totalWorkouts: 28,
        averageWorkoutDuration: 67,
        totalVolumeLifted: 15420,
        strengthProgression: [
          {
            exercise: 'Bench Press',
            initialWeight: 60,
            currentWeight: 75,
            improvement: 25,
          },
          {
            exercise: 'Squat',
            initialWeight: 80,
            currentWeight: 95,
            improvement: 18.75,
          },
          {
            exercise: 'Deadlift',
            initialWeight: 100,
            currentWeight: 125,
            improvement: 25,
          },
        ],
        weeklyConsistency: [
          { week: 'Sem 1', completedDays: 3, targetDays: 4 },
          { week: 'Sem 2', completedDays: 4, targetDays: 4 },
          { week: 'Sem 3', completedDays: 2, targetDays: 4 },
          { week: 'Sem 4', completedDays: 4, targetDays: 4 },
        ],
        muscleGroupAnalysis: [
          {
            name: 'Pecho',
            totalSets: 45,
            averageRPE: 7.8,
            lastTrained: '2025-11-20',
            strength: 'fuerte',
          },
          {
            name: 'Espalda',
            totalSets: 38,
            averageRPE: 7.2,
            lastTrained: '2025-11-19',
            strength: 'moderado',
          },
          {
            name: 'Piernas',
            totalSets: 52,
            averageRPE: 8.1,
            lastTrained: '2025-11-21',
            strength: 'fuerte',
          },
        ],
        monthlyProgress: [
          { month: 'Sep', workouts: 8, volume: 4200, avgRPE: 7.1 },
          { month: 'Oct', workouts: 12, volume: 5800, avgRPE: 7.4 },
          { month: 'Nov', workouts: 8, volume: 5420, avgRPE: 7.6 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'fuerte': return '#22c55e';
      case 'moderado': return '#f59e0b';
      case 'débil': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConsistencyPercentage = (completed: number, target: number) => {
    return Math.round((completed / target) * 100);
  };

  const renderStrengthTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Progresión de Fuerza</Text>
      {metrics.strengthProgression.map((exercise, index) => (
        <View key={index} style={styles.progressionCard}>
          <View style={styles.progressionHeader}>
            <Text style={styles.exerciseName}>{exercise.exercise}</Text>
            <Text style={styles.improvementPercent}>
              +{exercise.improvement.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.weightProgression}>
            <View style={styles.weightInfo}>
              <Text style={styles.weightLabel}>Inicial</Text>
              <Text style={styles.weightValue}>{exercise.initialWeight}kg</Text>
            </View>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
            <View style={styles.weightInfo}>
              <Text style={styles.weightLabel}>Actual</Text>
              <Text style={[styles.weightValue, { color: '#22c55e' }]}>
                {exercise.currentWeight}kg
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(exercise.improvement * 2, 100)}%` }
              ]} 
            />
          </View>
        </View>
      ))}

      <View style={styles.muscleAnalysisSection}>
        <Text style={styles.sectionTitle}>Análisis por Grupo Muscular</Text>
        {metrics.muscleGroupAnalysis.map((muscle, index) => (
          <View key={index} style={styles.muscleAnalysisCard}>
            <View style={styles.muscleHeader}>
              <Text style={styles.muscleName}>{muscle.name}</Text>
              <View style={[styles.strengthBadge, { backgroundColor: getStrengthColor(muscle.strength) + '33' }]}>
                <Text style={[styles.strengthText, { color: getStrengthColor(muscle.strength) }]}>
                  {muscle.strength.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.muscleStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{muscle.totalSets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{muscle.averageRPE.toFixed(1)}</Text>
                <Text style={styles.statLabel}>RPE</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderVolumeTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Análisis de Volumen</Text>
      
      <View style={styles.volumeOverview}>
        <View style={styles.volumeCard}>
          <Text style={styles.volumeNumber}>{(metrics.totalVolumeLifted / 1000).toFixed(1)}k</Text>
          <Text style={styles.volumeLabel}>kg Total Movidos</Text>
        </View>
        <View style={styles.volumeCard}>
          <Text style={styles.volumeNumber}>{metrics.averageWorkoutDuration}</Text>
          <Text style={styles.volumeLabel}>min Promedio</Text>
        </View>
      </View>

      <View style={styles.monthlyChart}>
        <Text style={styles.chartTitle}>Progreso Mensual</Text>
        <View style={styles.chartContainer}>
          {metrics.monthlyProgress.map((month, index) => (
            <View key={index} style={styles.monthBar}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.volumeBar,
                    { height: `${(month.volume / 6000) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.monthLabel}>{month.month}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderConsistencyTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Análisis de Consistencia</Text>
      
      <View style={styles.consistencyOverview}>
        <Text style={styles.consistencyTitle}>Últimas 4 semanas</Text>
        {metrics.weeklyConsistency.map((week, index) => (
          <View key={index} style={styles.consistencyCard}>
            <View style={styles.consistencyHeader}>
              <Text style={styles.weekLabel}>{week.week}</Text>
              <Text style={styles.consistencyPercent}>
                {getConsistencyPercentage(week.completedDays, week.targetDays)}%
              </Text>
            </View>
            <View style={styles.dayIndicators}>
              {Array.from({ length: week.targetDays }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dayDot,
                    { backgroundColor: i < week.completedDays ? '#22c55e' : '#374151' }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.dayText}>
              {week.completedDays} de {week.targetDays} días
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Insights de Arnold</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
             Tu consistencia ha mejorado en las últimas semanas. ¡Sigue así!
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analizando tus métricas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métricas Detalladas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabBar}>
        {(['fuerza', 'volumen', 'consistencia'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'fuerza' && renderStrengthTab()}
        {activeTab === 'volumen' && renderVolumeTab()}
        {activeTab === 'consistencia' && renderConsistencyTab()}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: '#F9FAFB',
    fontSize: 16,
  } as TextStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  } as ViewStyle,
  backButton: {
    paddingRight: 16,
  } as ViewStyle,
  backButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
  headerSpacer: {
    width: 60,
  } as ViewStyle,
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  } as ViewStyle,
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  } as ViewStyle,
  activeTab: {
    backgroundColor: '#22c55e',
  } as ViewStyle,
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  activeTabText: {
    color: '#fff',
  } as TextStyle,
  tabContent: {
    padding: 16,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  } as TextStyle,
  progressionCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  } as ViewStyle,
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  } as TextStyle,
  improvementPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
  } as TextStyle,
  weightProgression: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,
  weightInfo: {
    alignItems: 'center',
  } as ViewStyle,
  weightLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  } as TextStyle,
  weightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  } as TextStyle,
  arrow: {
    paddingHorizontal: 16,
  } as ViewStyle,
  arrowText: {
    fontSize: 20,
    color: '#22c55e',
  } as TextStyle,
  progressBar: {
    height: 4,
    backgroundColor: '#1f2937',
    borderRadius: 2,
  } as ViewStyle,
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  } as ViewStyle,
  muscleAnalysisSection: {
    marginTop: 24,
  } as ViewStyle,
  muscleAnalysisCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  } as ViewStyle,
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  muscleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  } as TextStyle,
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  } as ViewStyle,
  strengthText: {
    fontSize: 10,
    fontWeight: '700',
  } as TextStyle,
  muscleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,
  stat: {
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
  } as TextStyle,
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  } as TextStyle,
  volumeOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  } as ViewStyle,
  volumeCard: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#1f2937',
  } as ViewStyle,
  volumeNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  } as TextStyle,
  volumeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  } as TextStyle,
  monthlyChart: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  } as ViewStyle,
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
    textAlign: 'center',
  } as TextStyle,
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  } as ViewStyle,
  monthBar: {
    alignItems: 'center',
  } as ViewStyle,
  barContainer: {
    height: 100,
    width: 24,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  } as ViewStyle,
  volumeBar: {
    width: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  } as ViewStyle,
  monthLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  } as TextStyle,
  consistencyOverview: {
    marginBottom: 24,
  } as ViewStyle,
  consistencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  } as TextStyle,
  consistencyCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  } as ViewStyle,
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  } as TextStyle,
  consistencyPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
  } as TextStyle,
  dayIndicators: {
    flexDirection: 'row',
    marginBottom: 8,
  } as ViewStyle,
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  } as ViewStyle,
  dayText: {
    fontSize: 12,
    color: '#9CA3AF',
  } as TextStyle,
  insightsSection: {
    marginTop: 24,
  } as ViewStyle,
  insightCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22c55e33',
  } as ViewStyle,
  insightText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
  } as TextStyle,
});
