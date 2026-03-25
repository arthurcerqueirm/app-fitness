export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string;
          secondary_muscles: string[] | null;
          equipment: string | null;
          instructions: string | null;
          video_url: string | null;
          image_url: string | null;
          difficulty: "beginner" | "intermediate" | "advanced" | null;
          is_compound: boolean;
          is_custom: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exercises"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
      };
      workout_templates: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["workout_templates"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["workout_templates"]["Insert"]>;
      };
      template_exercises: {
        Row: {
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
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["template_exercises"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["template_exercises"]["Insert"]>;
      };
      workout_sessions: {
        Row: {
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
          calories_burned: number | null;
          mood_before: number | null;
          mood_after: number | null;
          notes: string | null;
          rating: number | null;
          is_completed: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["workout_sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["workout_sessions"]["Insert"]>;
      };
      workout_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          set_type: "warmup" | "normal" | "drop" | "failure" | "rest_pause";
          reps: number | null;
          weight: number | null;
          rpe: number | null;
          duration_seconds: number | null;
          rest_taken_seconds: number | null;
          is_pr: boolean;
          notes: string | null;
          completed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["workout_sets"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["workout_sets"]["Insert"]>;
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          record_type: "1rm" | "max_weight" | "max_reps" | "max_volume";
          value: number;
          previous_value: number | null;
          achieved_at: string;
          session_id: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["personal_records"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["personal_records"]["Insert"]>;
      };
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          weight: number | null;
          body_fat_percentage: number | null;
          chest: number | null;
          waist: number | null;
          hips: number | null;
          biceps_left: number | null;
          biceps_right: number | null;
          thigh_left: number | null;
          thigh_right: number | null;
          calf_left: number | null;
          calf_right: number | null;
          neck: number | null;
          shoulders: number | null;
          notes: string | null;
          measured_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["body_measurements"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["body_measurements"]["Insert"]>;
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: "streak" | "volume" | "consistency" | "strength" | "milestone";
          requirement_type: string;
          requirement_value: number;
          xp_reward: number;
          rarity: "common" | "rare" | "epic" | "legendary";
        };
        Insert: Omit<Database["public"]["Tables"]["achievements"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_achievements"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["user_achievements"]["Insert"]>;
      };
      weight_log: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          logged_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["weight_log"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["weight_log"]["Insert"]>;
      };
    };
  };
}
