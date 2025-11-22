-- CONSULTAS SQL PARA DATOS REALES DE ARNOLD
-- Estas consultas deberían implementarse en tu backend FastAPI

-- 1. ESTADÍSTICAS BÁSICAS DEL USUARIO
-- GET /users/{user_id}/stats
SELECT 
    COUNT(DISTINCT ws.id) as total_sessions,
    COUNT(DISTINCT DATE(ws.started_at)) as total_days_trained,
    AVG(wset.rpe) as average_rpe,
    SUM(wset.actual_weight * wset.actual_reps) as total_volume_kg,
    AVG(
        JULIANDAY(ws.finished_at) - JULIANDAY(ws.started_at)
    ) * 24 * 60 as average_duration_minutes,
    MAX(DATE(ws.started_at)) as last_workout_date
FROM workout_sessions ws
LEFT JOIN workout_sets wset ON ws.id = wset.session_id
WHERE ws.user_id = ? 
  AND ws.status = 'completed'
  AND wset.actual_reps IS NOT NULL;

-- 2. PROGRESIÓN DE FUERZA POR EJERCICIO
-- GET /users/{user_id}/strength-progression
WITH exercise_progression AS (
    SELECT 
        e.name as exercise_name,
        e.muscle_group,
        DATE(ws.started_at) as workout_date,
        MAX(wset.actual_weight) as max_weight
    FROM workout_sets wset
    JOIN workout_sessions ws ON wset.session_id = ws.id
    JOIN exercises e ON wset.exercise_id = e.id
    WHERE ws.user_id = ? 
      AND ws.status = 'completed'
      AND wset.actual_weight IS NOT NULL
    GROUP BY e.id, DATE(ws.started_at)
),
first_last_weights AS (
    SELECT 
        exercise_name,
        muscle_group,
        MIN(workout_date) as first_date,
        MAX(workout_date) as last_date,
        FIRST_VALUE(max_weight) OVER (
            PARTITION BY exercise_name 
            ORDER BY workout_date ASC 
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as initial_weight,
        FIRST_VALUE(max_weight) OVER (
            PARTITION BY exercise_name 
            ORDER BY workout_date DESC 
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as current_weight
    FROM exercise_progression
)
SELECT 
    exercise_name,
    muscle_group,
    initial_weight,
    current_weight,
    ROUND(
        ((current_weight - initial_weight) / initial_weight * 100), 2
    ) as improvement_percentage
FROM first_last_weights
WHERE initial_weight > 0
GROUP BY exercise_name;

-- 3. ANÁLISIS DE CONSISTENCIA SEMANAL
-- GET /users/{user_id}/consistency-analysis
WITH weekly_stats AS (
    SELECT 
        strftime('%Y-%W', ws.started_at) as week_year,
        strftime('%W', ws.started_at) as week_number,
        COUNT(DISTINCT DATE(ws.started_at)) as days_trained
    FROM workout_sessions ws
    WHERE ws.user_id = ? 
      AND ws.status = 'completed'
      AND ws.started_at >= date('now', '-8 weeks')
    GROUP BY strftime('%Y-%W', ws.started_at)
)
SELECT 
    'Sem ' || week_number as week_label,
    days_trained as completed_days,
    4 as target_days,  -- Objetivo de 4 días por semana
    ROUND((days_trained / 4.0 * 100), 0) as consistency_percentage
FROM weekly_stats
ORDER BY week_year DESC
LIMIT 8;

-- 4. FRECUENCIA POR GRUPO MUSCULAR
-- GET /users/{user_id}/muscle-group-frequency
SELECT 
    e.muscle_group,
    COUNT(wset.id) as total_sets,
    AVG(wset.rpe) as average_rpe,
    MAX(DATE(ws.started_at)) as last_trained_date,
    COUNT(DISTINCT ws.id) as total_sessions
FROM workout_sets wset
JOIN workout_sessions ws ON wset.session_id = ws.id
JOIN exercises e ON wset.exercise_id = e.id
WHERE ws.user_id = ? 
  AND ws.status = 'completed'
  AND ws.started_at >= date('now', '-30 days')  -- Último mes
GROUP BY e.muscle_group
ORDER BY total_sets DESC;

-- 5. ANÁLISIS DE VOLUMEN MENSUAL
-- GET /users/{user_id}/volume-analysis
SELECT 
    strftime('%Y-%m', ws.started_at) as month_year,
    strftime('%m', ws.started_at) as month_number,
    COUNT(DISTINCT ws.id) as workouts_count,
    SUM(wset.actual_weight * wset.actual_reps) as total_volume,
    AVG(wset.rpe) as avg_rpe
FROM workout_sessions ws
JOIN workout_sets wset ON ws.id = wset.session_id
WHERE ws.user_id = ? 
  AND ws.status = 'completed'
  AND wset.actual_weight IS NOT NULL
  AND wset.actual_reps IS NOT NULL
  AND ws.started_at >= date('now', '-6 months')  -- Últimos 6 meses
GROUP BY strftime('%Y-%m', ws.started_at)
ORDER BY month_year ASC;

-- 6. RACHA ACTUAL DEL USUARIO
-- Para calcular días consecutivos de entrenamiento
WITH daily_workouts AS (
    SELECT 
        DATE(ws.started_at) as workout_date,
        ROW_NUMBER() OVER (ORDER BY DATE(ws.started_at) DESC) as rn
    FROM workout_sessions ws
    WHERE ws.user_id = ? 
      AND ws.status = 'completed'
    GROUP BY DATE(ws.started_at)
),
consecutive_days AS (
    SELECT 
        workout_date,
        DATE(workout_date, '+' || (rn-1) || ' days') as expected_date
    FROM daily_workouts
)
SELECT COUNT(*) as current_streak
FROM consecutive_days
WHERE workout_date = expected_date;

-- 7. MEJORES Y PEORES EJERCICIOS (por RPE)
SELECT 
    e.name as exercise_name,
    e.muscle_group,
    AVG(wset.rpe) as avg_rpe,
    COUNT(wset.id) as total_sets,
    CASE 
        WHEN AVG(wset.rpe) <= 7.0 THEN 'fuerte'
        WHEN AVG(wset.rpe) <= 8.5 THEN 'moderado'
        ELSE 'débil'
    END as strength_category
FROM workout_sets wset
JOIN workout_sessions ws ON wset.session_id = ws.id
JOIN exercises e ON wset.exercise_id = e.id
WHERE ws.user_id = ? 
  AND ws.status = 'completed'
  AND wset.rpe IS NOT NULL
  AND ws.started_at >= date('now', '-30 days')
GROUP BY e.id
HAVING COUNT(wset.id) >= 3  -- Al menos 3 sets para ser relevante
ORDER BY avg_rpe ASC;
