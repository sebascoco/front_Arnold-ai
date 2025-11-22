// app/constants/types.ts
export type ChatType = "general" | "session";

export interface ChatMessage {
  id: number;
  user_id: number;
  session_id: number | null;
  chat_type: ChatType;
  role: "user" | "arnold";
  text: string;
  audio_url?: string | null;
  timestamp: string;
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface WorkoutSet {
  id: number;
  exercise_id: number;
  exercise_order: number;
  set_number: number;
  target_reps: number;
  target_weight?: number | null;
  actual_reps?: number | null;
  actual_weight?: number | null;
  rpe?: number | null;
  comment?: string | null;
  auto_adjusted: boolean;
}

export type SessionStatus = "planned" | "in_progress" | "completed" | "canceled";

export interface WorkoutSession {
  id: number;
  user_id: number;
  started_at: string;
  finished_at: string | null;
  status: SessionStatus;
  fatigue_before?: number | null;
  sleep_hours_last_night?: number | null;
  notes?: string | null;
  sets: WorkoutSet[];
}
