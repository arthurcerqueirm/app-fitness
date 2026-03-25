export * from "./database";

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  weight: number | null;
  height: number | null;
  goal: "hypertrophy" | "strength" | "endurance" | "weight_loss" | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  streak_count: number;
  longest_streak: number;
  total_workouts: number;
  total_volume: number;
  total_time_minutes: number;
  xp: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  secondary_muscles: string[] | null;
  equipment: string | null;
  instructions: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  is_compound: boolean;
  is_custom: boolean;
  created_by: string | null;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  day_of_week: number[] | null;
  estimated_duration: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string;
  target_weight: number | null;
  target_rpe: number | null;
  rest_seconds: number;
  superset_group: string | null;
  notes: string | null;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  started_at: string;
  finished_at: string | null;
  duration_minutes: number | null;
  total_volume: number;
  total_sets: number;
  total_reps: number;
  mood_before: number | null;
  mood_after: number | null;
  notes: string | null;
  rating: number | null;
  is_completed: boolean;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  set_type: "warmup" | "normal" | "drop" | "failure" | "rest_pause";
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  is_pr: boolean;
  notes: string | null;
  completed_at: string;
}

export interface ActiveSet {
  id: string;
  setNumber: number;
  type: "warmup" | "normal" | "drop" | "failure" | "rest_pause";
  weight: string;
  reps: string;
  completed: boolean;
  isPR: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  sets: ActiveSet[];
  targetSets: number;
  targetReps: string;
  targetWeight: number | null;
  restSeconds: number;
  notes: string | null;
  supersetGroup: string | null;
  isCompleted: boolean;
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "abs"
  | "cardio"
  | "full_body";

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: "Peito",
  back: "Costas",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  legs: "Pernas",
  glutes: "Glúteos",
  abs: "Abdômen",
  cardio: "Cardio",
  full_body: "Corpo Inteiro",
};

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: "#FF4757",
  back: "#4ECDC4",
  shoulders: "#FFA502",
  biceps: "#2ED573",
  triceps: "#BEFF00",
  legs: "#A855F7",
  glutes: "#FF6B9D",
  abs: "#FF7F50",
  cardio: "#00CEC9",
  full_body: "#6C5CE7",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Halter",
  cable: "Cabo",
  machine: "Máquina",
  bodyweight: "Peso Corporal",
  band: "Elástico",
  kettlebell: "Kettlebell",
};

export const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const GOAL_LABELS: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  endurance: "Resistência",
  weight_loss: "Emagrecimento",
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};
