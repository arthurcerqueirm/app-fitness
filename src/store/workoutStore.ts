import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveExercise, ActiveSet } from "@/types";

interface WorkoutState {
  sessionId: string | null;
  templateId: string | null;
  templateName: string;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  startedAt: string | null;
  isActive: boolean;
  isPaused: boolean;
  restTimerActive: boolean;
  restTimeRemaining: number;
  restTimerDefaultSeconds: number;
  moodBefore: number | null;

  // Actions
  startWorkout: (params: {
    sessionId: string;
    templateId: string | null;
    templateName: string;
    exercises: ActiveExercise[];
    moodBefore?: number;
  }) => void;
  endWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  setCurrentExercise: (index: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<ActiveSet>) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  completeSet: (exerciseIndex: number, setIndex: number) => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  stopRestTimer: () => void;
  markExerciseComplete: (exerciseIndex: number) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      templateId: null,
      templateName: "",
      exercises: [],
      currentExerciseIndex: 0,
      startedAt: null,
      isActive: false,
      isPaused: false,
      restTimerActive: false,
      restTimeRemaining: 90,
      restTimerDefaultSeconds: 90,
      moodBefore: null,

      startWorkout: ({ sessionId, templateId, templateName, exercises, moodBefore }) => {
        set({
          sessionId,
          templateId,
          templateName,
          exercises,
          currentExerciseIndex: 0,
          startedAt: new Date().toISOString(),
          isActive: true,
          isPaused: false,
          moodBefore: moodBefore ?? null,
        });
      },

      endWorkout: () => {
        set({
          sessionId: null,
          templateId: null,
          templateName: "",
          exercises: [],
          currentExerciseIndex: 0,
          startedAt: null,
          isActive: false,
          isPaused: false,
          restTimerActive: false,
          moodBefore: null,
        });
      },

      pauseWorkout: () => set({ isPaused: true }),
      resumeWorkout: () => set({ isPaused: false }),

      setCurrentExercise: (index) => set({ currentExerciseIndex: index }),

      updateSet: (exerciseIndex, setIndex, data) => {
        const exercises = [...get().exercises];
        exercises[exerciseIndex] = {
          ...exercises[exerciseIndex],
          sets: exercises[exerciseIndex].sets.map((s, i) =>
            i === setIndex ? { ...s, ...data } : s
          ),
        };
        set({ exercises });
      },

      addSet: (exerciseIndex) => {
        const exercises = [...get().exercises];
        const exercise = exercises[exerciseIndex];
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: ActiveSet = {
          id: crypto.randomUUID(),
          setNumber: exercise.sets.length + 1,
          type: "normal",
          weight: lastSet?.weight ?? "",
          reps: lastSet?.reps ?? exercise.targetReps,
          completed: false,
          isPR: false,
        };
        exercises[exerciseIndex] = {
          ...exercise,
          sets: [...exercise.sets, newSet],
        };
        set({ exercises });
      },

      removeSet: (exerciseIndex, setIndex) => {
        const exercises = [...get().exercises];
        exercises[exerciseIndex] = {
          ...exercises[exerciseIndex],
          sets: exercises[exerciseIndex].sets
            .filter((_, i) => i !== setIndex)
            .map((s, i) => ({ ...s, setNumber: i + 1 })),
        };
        set({ exercises });
      },

      completeSet: (exerciseIndex, setIndex) => {
        const exercises = [...get().exercises];
        exercises[exerciseIndex] = {
          ...exercises[exerciseIndex],
          sets: exercises[exerciseIndex].sets.map((s, i) =>
            i === setIndex ? { ...s, completed: true } : s
          ),
        };
        set({ exercises });
      },

      startRestTimer: (seconds) => {
        set({ restTimerActive: true, restTimeRemaining: seconds });
      },

      tickRestTimer: () => {
        const remaining = get().restTimeRemaining;
        if (remaining <= 0) {
          set({ restTimerActive: false, restTimeRemaining: 0 });
        } else {
          set({ restTimeRemaining: remaining - 1 });
        }
      },

      stopRestTimer: () => {
        set({ restTimerActive: false });
      },

      markExerciseComplete: (exerciseIndex) => {
        const exercises = [...get().exercises];
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], isCompleted: true };
        set({ exercises });
      },
    }),
    {
      name: "beast-mode-workout",
      partialize: (state) => ({
        sessionId: state.sessionId,
        templateId: state.templateId,
        templateName: state.templateName,
        exercises: state.exercises,
        currentExerciseIndex: state.currentExerciseIndex,
        startedAt: state.startedAt,
        isActive: state.isActive,
        moodBefore: state.moodBefore,
      }),
    }
  )
);
