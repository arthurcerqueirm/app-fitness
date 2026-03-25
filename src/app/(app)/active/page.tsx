"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { useWorkoutStore } from "@/store/workoutStore";
import {
  X, Check, Plus, Minus, ChevronLeft, ChevronRight, Clock, Zap,
  Flame, Trophy, SkipForward, Timer, Star, Dumbbell, Play
} from "lucide-react";
import { formatTimer, haptic, calculate1RM, formatVolume } from "@/lib/utils";
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from "@/types";
import type { ActiveExercise, ActiveSet } from "@/types";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const SET_TYPES = [
  { value: "warmup", label: "Aquecimento", color: "#FFA502" },
  { value: "normal", label: "Normal", color: "#BEFF00" },
  { value: "drop", label: "Drop Set", color: "#FF4757" },
  { value: "failure", label: "Falha", color: "#A855F7" },
  { value: "rest_pause", label: "Rest-Pause", color: "#4ECDC4" },
];

// ─── Rest Timer Overlay ────────────────────────────────────────────────────────
function RestTimerOverlay({
  seconds,
  total,
  onSkip,
  onAdd,
  onMinus,
  nextText,
}: {
  seconds: number;
  total: number;
  onSkip: () => void;
  onAdd: () => void;
  onMinus: () => void;
  nextText: string;
}) {
  const progress = ((total - seconds) / total) * 100;
  const radius = 100;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const color = seconds > total * 0.6 ? "#2ED573" : seconds > total * 0.3 ? "#FFA502" : "#FF4757";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(10,10,15,0.97)", backdropFilter: "blur(24px)" }}
    >
      <p className="text-xs font-semibold mb-8" style={{ color: "#6B6B80", letterSpacing: "0.2em" }}>
        DESCANSANDO
      </p>

      <div className="relative">
        <svg width={240} height={240} className="-rotate-90">
          <circle cx={120} cy={120} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <motion.circle
            cx={120} cy={120} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5 }}
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={seconds}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono font-black"
            style={{ fontSize: "4.5rem", color, lineHeight: 1 }}
          >
            {formatTimer(seconds)}
          </motion.span>
          <span className="text-xs mt-1" style={{ color: "#6B6B80" }}>{nextText}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onMinus}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.06)", color: "#FAFAFA" }}>
          -15s
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onSkip}
          className="w-20 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold"
          style={{ background: "#BEFF00", color: "#0A0A0F" }}>
          <SkipForward className="w-4 h-4" />
          Pular
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAdd}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.06)", color: "#FAFAFA" }}>
          +15s
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
function SetRow({
  set,
  onUpdate,
  onComplete,
  weightIncrement,
}: {
  set: ActiveSet;
  onUpdate: (field: keyof ActiveSet, value: unknown) => void;
  onComplete: () => void;
  weightIncrement: number;
}) {
  const typeInfo = SET_TYPES.find((t) => t.value === set.type) ?? SET_TYPES[1];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 py-2"
      style={{
        background: set.completed ? "rgba(190,255,0,0.04)" : "transparent",
        borderRadius: 12,
        paddingLeft: 8,
        paddingRight: 8,
        borderLeft: set.completed ? "2px solid rgba(190,255,0,0.3)" : "2px solid transparent",
      }}
    >
      {/* Set number */}
      <span className="w-7 text-center text-xs font-bold font-mono"
        style={{ color: set.completed ? "#BEFF00" : "#6B6B80" }}>
        {set.setNumber}
      </span>

      {/* Type badge */}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-lg font-medium"
        style={{ background: `${typeInfo.color}22`, color: typeInfo.color, minWidth: 44, textAlign: "center" }}
      >
        {typeInfo.label.split(" ")[0]}
      </span>

      {/* Weight input */}
      <div className="flex-1 flex items-center gap-1">
        <button
          onClick={() => onUpdate("weight", String(Math.max(0, (parseFloat(set.weight || "0") - weightIncrement))))}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Minus className="w-3 h-3" style={{ color: "#6B6B80" }} />
        </button>
        <input
          type="number"
          value={set.weight}
          onChange={(e) => onUpdate("weight", e.target.value)}
          placeholder="kg"
          className="flex-1 text-center text-sm font-mono font-bold rounded-lg h-8"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: "#FAFAFA",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          onClick={() => onUpdate("weight", String((parseFloat(set.weight || "0") + weightIncrement).toFixed(1)))}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Plus className="w-3 h-3" style={{ color: "#6B6B80" }} />
        </button>
      </div>

      <span className="text-xs" style={{ color: "#3A3A4A" }}>×</span>

      {/* Reps input */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate("reps", String(Math.max(0, (parseInt(set.reps || "0") - 1))))}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Minus className="w-3 h-3" style={{ color: "#6B6B80" }} />
        </button>
        <input
          type="number"
          value={set.reps}
          onChange={(e) => onUpdate("reps", e.target.value)}
          placeholder="reps"
          className="w-12 text-center text-sm font-mono font-bold rounded-lg h-8"
          style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#FAFAFA", outline: "none" }}
        />
        <button
          onClick={() => onUpdate("reps", String(parseInt(set.reps || "0") + 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Plus className="w-3 h-3" style={{ color: "#6B6B80" }} />
        </button>
      </div>

      {/* Complete button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onComplete}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: set.completed ? "#BEFF00" : "rgba(255,255,255,0.06)",
          border: set.completed ? "none" : "2px dashed rgba(255,255,255,0.15)",
        }}
      >
        {set.completed && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
        {set.isPR && <span className="absolute -top-1 -right-1 text-xs">🔥</span>}
      </motion.button>
    </motion.div>
  );
}

// ─── Workout Summary ──────────────────────────────────────────────────────────
function WorkoutSummary({
  exercises,
  startedAt,
  onSave,
  saving,
}: {
  exercises: ActiveExercise[];
  startedAt: string;
  onSave: (mood: number, rating: number, notes: string) => void;
  saving: boolean;
}) {
  const [mood, setMood] = useState(3);
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");

  const totalSets = exercises.flatMap((e) => e.sets.filter((s) => s.completed)).length;
  const totalReps = exercises.flatMap((e) => e.sets.filter((s) => s.completed)).reduce((s, set) => s + parseInt(set.reps || "0"), 0);
  const totalVolume = exercises.flatMap((e) => e.sets.filter((s) => s.completed)).reduce((s, set) => {
    return s + (parseFloat(set.weight || "0") * parseInt(set.reps || "0"));
  }, 0);
  const durationMin = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000);
  const prs = exercises.flatMap((e) => e.sets.filter((s) => s.isPR));

  const MOODS = ["😫", "😕", "😐", "😊", "🔥"];
  const STARS = [1, 2, 3, 4, 5];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "#0A0A0F" }}
    >
      <div className="px-5 pt-safe pb-8">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #BEFF00, #7FCC00)", boxShadow: "0 0 40px rgba(190,255,0,0.4)" }}
          >
            <Trophy className="w-10 h-10 text-black" />
          </motion.div>
          <h2 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Treino Concluído! 🔥</h2>
          <p className="text-sm mt-1" style={{ color: "#6B6B80" }}>Mais um dia dominado.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Volume", value: formatVolume(totalVolume), icon: <Zap className="w-4 h-4" style={{ color: "#BEFF00" }} /> },
            { label: "Duração", value: `${durationMin}min`, icon: <Clock className="w-4 h-4" style={{ color: "#FFA502" }} /> },
            { label: "Séries", value: String(totalSets), icon: <Flame className="w-4 h-4" style={{ color: "#FF4757" }} /> },
            { label: "Reps", value: String(totalReps), icon: <Star className="w-4 h-4" style={{ color: "#4ECDC4" }} /> },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="glass-card p-4 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">{stat.icon}<span className="text-xs" style={{ color: "#6B6B80" }}>{stat.label}</span></div>
              <span className="text-2xl font-black font-mono" style={{ color: "#FAFAFA" }}>{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* PRs */}
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-5 p-4 rounded-2xl"
            style={{ background: "rgba(190,255,0,0.08)", border: "1px solid rgba(190,255,0,0.3)" }}
          >
            <p className="font-bold text-sm mb-2" style={{ color: "#BEFF00" }}>🔥 {prs.length} PR{prs.length > 1 ? "s" : ""} Batido{prs.length > 1 ? "s" : ""}!</p>
            <p className="text-xs" style={{ color: "#6B6B80" }}>Você superou seus recordes pessoais hoje!</p>
          </motion.div>
        )}

        {/* Mood */}
        <div className="mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "#6B6B80" }}>COMO VOCÊ SE SENTIU?</p>
          <div className="flex gap-3 justify-center">
            {MOODS.map((emoji, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.85 }}
                onClick={() => setMood(i + 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all"
                style={{
                  background: mood === i + 1 ? "rgba(190,255,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: mood === i + 1 ? "2px solid rgba(190,255,0,0.4)" : "2px solid transparent",
                  transform: mood === i + 1 ? "scale(1.15)" : "scale(1)",
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "#6B6B80" }}>AVALIAÇÃO DO TREINO</p>
          <div className="flex gap-2 justify-center">
            {STARS.map((s) => (
              <motion.button key={s} whileTap={{ scale: 0.9 }} onClick={() => setRating(s)}>
                <Star
                  className="w-8 h-8 transition-all"
                  style={{ color: s <= rating ? "#FFA502" : "#3A3A4A" }}
                  fill={s <= rating ? "#FFA502" : "none"}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B6B80" }}>NOTAS (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como foi o treino hoje?"
            className="input-field resize-none"
            rows={3}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSave(mood, rating, notes)}
          disabled={saving}
          className="btn-primary"
          style={{ boxShadow: "0 0 20px rgba(190,255,0,0.3)" }}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" fill="black" />
              Salvar Treino
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, defaultRestSeconds, weightIncrement } = useUserStore();
  const {
    sessionId, exercises, currentExerciseIndex, startedAt, isActive, moodBefore,
    startWorkout, endWorkout, setCurrentExercise, updateSet, addSet, removeSet,
    completeSet, startRestTimer, tickRestTimer, stopRestTimer, restTimerActive,
    restTimeRemaining, restTimerDefaultSeconds,
  } = useWorkoutStore();

  const templateId = searchParams.get("template");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [moodBeforeState, setMoodBeforeState] = useState<number | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pickerTemplates, setPickerTemplates] = useState<{ id: string; name: string; color: string; estimated_duration?: number; exercise_count?: number }[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = exercises[currentExerciseIndex];

  // Elapsed timer
  useEffect(() => {
    if (isActive && startedAt) {
      const tick = () => {
        setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [isActive, startedAt]);

  // Rest timer
  useEffect(() => {
    if (restTimerActive) {
      restTimerRef.current = setInterval(() => {
        tickRestTimer();
      }, 1000);
      return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      if (restTimeRemaining === 0) {
        haptic([100, 50, 100]);
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 300]);
        }
      }
    }
  }, [restTimerActive]);

  // Init workout if coming with templateId, otherwise show picker
  useEffect(() => {
    if (isActive) return;
    if (templateId) {
      initWorkout(templateId);
    } else {
      loadPickerTemplates();
    }
  }, []);

  async function loadPickerTemplates() {
    if (!profile) { setShowTemplatePicker(true); return; }
    setPickerLoading(true);
    setShowTemplatePicker(true);
    const { data } = await supabase
      .from("workout_templates")
      .select("id, name, color, estimated_duration, template_exercises(count)")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("sort_order");
    setPickerTemplates(
      (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        color: t.color ?? "#BEFF00",
        estimated_duration: t.estimated_duration,
        exercise_count: t.template_exercises?.[0]?.count ?? 0,
      }))
    );
    setPickerLoading(false);
  }

  async function initWorkout(tid: string) {
    if (!profile) { toast.error("Perfil não carregado, tente novamente"); return; }
    setLoading(true);
    const { data } = await supabase
      .from("workout_templates")
      .select(`*, template_exercises(*, exercise:exercises(*))`)
      .eq("id", tid)
      .single();

    if (!data) { setLoading(false); toast.error("Treino não encontrado"); return; }

    const exerciseList: ActiveExercise[] = (data.template_exercises as any[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((te) => ({
        exerciseId: te.exercise.id,
        name: te.exercise.name,
        muscleGroup: te.exercise.muscle_group,
        equipment: te.exercise.equipment,
        targetSets: te.target_sets,
        targetReps: te.target_reps,
        targetWeight: te.target_weight,
        restSeconds: te.rest_seconds ?? 90,
        notes: te.notes,
        supersetGroup: te.superset_group,
        isCompleted: false,
        sets: Array.from({ length: te.target_sets }, (_, i) => ({
          id: crypto.randomUUID(),
          setNumber: i + 1,
          type: "normal" as const,
          weight: String(te.target_weight ?? ""),
          reps: te.target_reps.replace(/\D/g, "") || "12",
          completed: false,
          isPR: false,
        })),
      }));

    // Create session in DB
    const { data: session } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: profile.id,
        template_id: tid,
        name: data.name,
        is_completed: false,
        total_volume: 0,
        total_sets: 0,
        total_reps: 0,
      })
      .select()
      .single();

    startWorkout({
      sessionId: session?.id ?? crypto.randomUUID(),
      templateId: tid,
      templateName: data.name,
      exercises: exerciseList,
    });
    setLoading(false);
  }

  async function startFreeWorkout() {
    if (!profile) { toast.error("Perfil não carregado, tente novamente"); return; }
    const { data: session } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: profile.id,
        template_id: null,
        name: "Treino Livre",
        is_completed: false,
        total_volume: 0,
        total_sets: 0,
        total_reps: 0,
        mood_before: moodBeforeState,
      })
      .select()
      .single();

    startWorkout({
      sessionId: session?.id ?? crypto.randomUUID(),
      templateId: null,
      templateName: "Treino Livre",
      exercises: [],
      moodBefore: moodBeforeState ?? undefined,
    });
    setShowMoodPicker(false);
  }

  async function handleSaveWorkout(moodAfter: number, rating: number, notes: string) {
    setSaving(true);
    try {
      const completedSets = exercises.flatMap((e) => e.sets.filter((s) => s.completed));
      const totalVolume = completedSets.reduce((sum, s) => sum + parseFloat(s.weight || "0") * parseInt(s.reps || "0"), 0);
      const totalSets = completedSets.length;
      const totalReps = completedSets.reduce((sum, s) => sum + parseInt(s.reps || "0"), 0);
      const durationMin = Math.round(elapsed / 60);

      // Save session
      await supabase.from("workout_sessions").update({
        finished_at: new Date().toISOString(),
        duration_minutes: durationMin,
        total_volume: totalVolume,
        total_sets: totalSets,
        total_reps: totalReps,
        mood_before: moodBefore,
        mood_after: moodAfter,
        rating,
        notes: notes || null,
        is_completed: true,
      }).eq("id", sessionId);

      // Save sets
      const setInserts = exercises.flatMap((exercise) =>
        exercise.sets
          .filter((s) => s.completed)
          .map((s) => ({
            session_id: sessionId,
            exercise_id: exercise.exerciseId,
            set_number: s.setNumber,
            set_type: s.type,
            reps: parseInt(s.reps) || null,
            weight: parseFloat(s.weight) || null,
            is_pr: s.isPR,
          }))
      );
      if (setInserts.length > 0) {
        await supabase.from("workout_sets").insert(setInserts);
      }

      // Update profile stats
      await supabase.from("profiles").update({
        total_workouts: (profile?.total_workouts ?? 0) + 1,
        total_volume: (profile?.total_volume ?? 0) + totalVolume,
        total_time_minutes: (profile?.total_time_minutes ?? 0) + durationMin,
      }).eq("id", profile!.id);

      // Confetti!
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 }, colors: ["#BEFF00", "#7FCC00", "#FFFFFF"] });

      endWorkout();
      router.push("/home");
      toast.success(`Treino salvo! +${totalSets * 5} XP 🔥`);
    } catch {
      toast.error("Erro ao salvar treino");
    } finally {
      setSaving(false);
    }
  }

  function handleSetComplete(exerciseIndex: number, setIndex: number) {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    if (set.completed) return;

    haptic(50);
    completeSet(exerciseIndex, setIndex);
    const restTime = exercise.restSeconds || defaultRestSeconds;
    startRestTimer(restTime);
  }

  function handleSetUpdate(exerciseIndex: number, setIndex: number, field: keyof ActiveSet, value: unknown) {
    updateSet(exerciseIndex, setIndex, { [field]: value } as Partial<ActiveSet>);
  }

  function handleAddSet(exerciseIndex: number) {
    addSet(exerciseIndex);
    haptic(30);
  }

  const completedExercises = exercises.filter((e) => e.sets.every((s) => s.completed)).length;
  const totalProgress = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  // Loading
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#BEFF00", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#6B6B80" }}>Preparando treino...</p>
        </div>
      </div>
    );
  }

  // Template picker
  if (showTemplatePicker) {
    const MOODS = ["😫", "😕", "😐", "😊", "🔥"];
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: "#0A0A0F" }}>
        <div className="px-5 pt-safe">
          <div className="flex items-center justify-between pt-4 pb-5">
            <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Iniciar Treino</h1>
            <button
              onClick={() => router.push("/home")}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X className="w-4 h-4" style={{ color: "#6B6B80" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {pickerLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : pickerTemplates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(190,255,0,0.1)", border: "1px solid rgba(190,255,0,0.2)" }}>
                <Dumbbell className="w-8 h-8" style={{ color: "#BEFF00" }} />
              </div>
              <div>
                <p className="font-bold mb-1" style={{ color: "#FAFAFA" }}>Nenhum treino criado</p>
                <p className="text-sm" style={{ color: "#6B6B80" }}>Crie um treino ou inicie livre</p>
              </div>
              <button onClick={() => router.push("/workouts/new")} className="btn-primary" style={{ width: "auto", paddingLeft: 20, paddingRight: 20 }}>
                <Plus className="w-4 h-4" />
                Criar Treino
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold mb-3" style={{ color: "#6B6B80" }}>SEUS TREINOS</p>
              {pickerTemplates.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowTemplatePicker(false); initWorkout(t.id); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                  style={{ background: `${t.color}10`, border: `1px solid ${t.color}30` }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.color}22` }}>
                    <Dumbbell className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: "#FAFAFA" }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6B80" }}>
                      {t.exercise_count} exercício{t.exercise_count !== 1 ? "s" : ""}
                      {t.estimated_duration ? ` · ${t.estimated_duration}min` : ""}
                    </p>
                  </div>
                  <Play className="w-5 h-5 flex-shrink-0" style={{ color: t.color }} fill={t.color} />
                </motion.button>
              ))}
            </div>
          )}

          {/* Free workout divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#6B6B80" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Free workout section */}
          {!showMoodPicker ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowMoodPicker(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(190,255,0,0.1)" }}>
                <Zap className="w-5 h-5" style={{ color: "#BEFF00" }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold" style={{ color: "#FAFAFA" }}>Treino Livre</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B6B80" }}>Sem template, adicione exercícios</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "#6B6B80" }} />
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <p className="font-bold mb-1" style={{ color: "#FAFAFA" }}>Como está se sentindo?</p>
              <p className="text-xs mb-4" style={{ color: "#6B6B80" }}>Antes de começar o treino</p>
              <div className="flex gap-2 justify-center mb-5">
                {["😫", "😕", "😐", "😊", "🔥"].map((emoji, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setMoodBeforeState(i + 1)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      background: moodBeforeState === i + 1 ? "rgba(190,255,0,0.15)" : "rgba(255,255,255,0.04)",
                      border: moodBeforeState === i + 1 ? "2px solid rgba(190,255,0,0.4)" : "2px solid transparent",
                    }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={startFreeWorkout} className="btn-primary">
                <Zap className="w-5 h-5" fill="black" />
                Iniciar Treino Livre
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // No active workout fallback
  if (!isActive || !currentExercise) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5" style={{ background: "#0A0A0F" }}>
        <p style={{ color: "#6B6B80" }}>Nenhum treino ativo</p>
        <button onClick={() => router.push("/home")} className="btn-primary mt-4">
          Voltar
        </button>
      </div>
    );
  }

  // Summary
  if (showSummary) {
    return (
      <WorkoutSummary
        exercises={exercises}
        startedAt={startedAt!}
        onSave={handleSaveWorkout}
        saving={saving}
      />
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#0A0A0F" }}>
      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {restTimerActive && (
          <RestTimerOverlay
            seconds={restTimeRemaining}
            total={currentExercise.restSeconds}
            onSkip={stopRestTimer}
            onAdd={() => useWorkoutStore.setState({ restTimeRemaining: restTimeRemaining + 15 })}
            onMinus={() => useWorkoutStore.setState({ restTimeRemaining: Math.max(0, restTimeRemaining - 15) })}
            nextText={currentExercise.sets.some((s) => !s.completed) ? "Próximo set" : "Próximo exercício"}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-safe"
        style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => {
              if (confirm("Deseja cancelar o treino?")) { endWorkout(); router.push("/home"); }
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,71,87,0.1)" }}
          >
            <X className="w-4 h-4" style={{ color: "#FF4757" }} />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-bold" style={{ color: "#FAFAFA" }}>{useWorkoutStore.getState().templateName}</span>
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" style={{ color: "#BEFF00" }} />
              <span className="font-mono text-xs font-bold" style={{ color: "#BEFF00" }}>
                {formatTimer(elapsed)}
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSummary(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: "#BEFF00", color: "#0A0A0F" }}
          >
            Finalizar
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #BEFF00, #7FCC00)" }}
          />
        </div>
      </div>

      {/* Exercise navigation dots */}
      <div className="flex justify-center gap-1.5 py-3 px-4">
        {exercises.map((ex, i) => (
          <button
            key={i}
            onClick={() => setCurrentExercise(i)}
            className="transition-all duration-200"
            style={{
              width: i === currentExerciseIndex ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: ex.isCompleted
                ? "#BEFF00"
                : i === currentExerciseIndex
                ? "rgba(190,255,0,0.5)"
                : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExerciseIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Exercise Header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${MUSCLE_GROUP_COLORS[currentExercise.muscleGroup] ?? "#BEFF00"}22`,
                  border: `1px solid ${MUSCLE_GROUP_COLORS[currentExercise.muscleGroup] ?? "#BEFF00"}44`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: MUSCLE_GROUP_COLORS[currentExercise.muscleGroup] ?? "#BEFF00" }}>
                  {currentExerciseIndex + 1}/{exercises.length}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: "#FAFAFA" }}>{currentExercise.name}</h2>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: `${MUSCLE_GROUP_COLORS[currentExercise.muscleGroup] ?? "#BEFF00"}22`,
                    color: MUSCLE_GROUP_COLORS[currentExercise.muscleGroup] ?? "#BEFF00",
                  }}
                >
                  {MUSCLE_GROUP_LABELS[currentExercise.muscleGroup] ?? currentExercise.muscleGroup}
                </span>
              </div>
            </div>

            {/* Sets */}
            <div className="glass-card p-4 mb-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 text-[10px] font-semibold" style={{ color: "#6B6B80" }}>
                <span className="w-7 text-center">#</span>
                <span style={{ minWidth: 44 }}>TIPO</span>
                <span className="flex-1 text-center">PESO (kg)</span>
                <span className="text-center" style={{ width: 44 }}>×</span>
                <span className="text-center" style={{ width: 80 }}>REPS</span>
                <span className="w-10 text-center">OK</span>
              </div>

              {currentExercise.sets.map((set, setIdx) => (
                <SetRow
                  key={set.id}
                  set={set}
                  onUpdate={(field, value) => handleSetUpdate(currentExerciseIndex, setIdx, field, value)}
                  onComplete={() => handleSetComplete(currentExerciseIndex, setIdx)}
                  weightIncrement={weightIncrement}
                />
              ))}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAddSet(currentExerciseIndex)}
                className="w-full mt-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", color: "#6B6B80" }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Set
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div
        className="px-4 py-3 flex items-center gap-3 pb-safe"
        style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentExercise(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)", opacity: currentExerciseIndex === 0 ? 0.3 : 1 }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: "#FAFAFA" }} />
        </motion.button>

        <div className="flex-1 text-center">
          <p className="text-xs font-medium" style={{ color: "#6B6B80" }}>
            {currentExercise.sets.filter((s) => s.completed).length}/{currentExercise.sets.length} sets completos
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (currentExerciseIndex < exercises.length - 1) {
              setCurrentExercise(currentExerciseIndex + 1);
            } else {
              setShowSummary(true);
            }
          }}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: currentExerciseIndex === exercises.length - 1 ? "#BEFF00" : "rgba(255,255,255,0.06)" }}
        >
          {currentExerciseIndex === exercises.length - 1 ? (
            <Trophy className="w-5 h-5 text-black" />
          ) : (
            <ChevronRight className="w-5 h-5" style={{ color: "#FAFAFA" }} />
          )}
        </motion.button>
      </div>
    </div>
  );
}


export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#BEFF00", borderTopColor: "transparent" }} />
      </div>
    }>
      <ActiveWorkoutContent />
    </Suspense>
  );
}
