"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { useWorkoutStore } from "@/store/workoutStore";
import {
  X, Check, Plus, Minus, ChevronLeft, ChevronRight, Clock, Zap,
  Flame, Trophy, SkipForward, Timer, Star, Dumbbell, Play, Pause, List
} from "lucide-react";
import { formatTimer, haptic, formatVolume } from "@/lib/utils";
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from "@/types";
import type { ActiveExercise, ActiveSet } from "@/types";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

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
    startWorkout, endWorkout, setCurrentExercise, updateSet, completeSet, 
    startRestTimer, tickRestTimer, stopRestTimer, restTimerActive,
    restTimeRemaining, addSet
  } = useWorkoutStore();

  const templateId = searchParams.get("template");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [moodBeforeState, setMoodBeforeState] = useState<number | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pickerTemplates, setPickerTemplates] = useState<{ id: string; name: string; color: string; estimated_duration?: number; exercise_count?: number }[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived state for Focus Mode
  const currentExercise = exercises[currentExerciseIndex];
  
  // Find the first uncompleted set. If all completed, it's null.
  const uncompletedSetIndex = currentExercise?.sets.findIndex(s => !s.completed) ?? -1;
  const currentSet = uncompletedSetIndex !== -1 ? currentExercise?.sets[uncompletedSetIndex] : null;

  // Elapsed timer
  useEffect(() => {
    if (isActive && startedAt) {
      const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [isActive, startedAt]);

  // Rest timer
  useEffect(() => {
    if (restTimerActive) {
      restTimerRef.current = setInterval(() => tickRestTimer(), 1000);
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

  // Auto-advance if the current exercise is entirely complete but we aren't resting
  // and there's a next exercise.
  useEffect(() => {
    if (!isActive || restTimerActive || !currentExercise || showOverview) return;
    
    if (uncompletedSetIndex === -1 && currentExerciseIndex < exercises.length - 1) {
      setCurrentExercise(currentExerciseIndex + 1);
    }
  }, [uncompletedSetIndex, isActive, restTimerActive, currentExerciseIndex, exercises.length, showOverview]);

  // Init workout
  useEffect(() => {
    if (isActive) return;
    if (templateId) initWorkout(templateId);
    else loadPickerTemplates();
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
    if (!profile) { toast.error("Perfil não carregado"); return; }
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
    if (!profile) { toast.error("Perfil não carregado"); return; }
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

      await supabase.from("profiles").update({
        total_workouts: (profile?.total_workouts ?? 0) + 1,
        total_volume: (profile?.total_volume ?? 0) + totalVolume,
        total_time_minutes: (profile?.total_time_minutes ?? 0) + durationMin,
      }).eq("id", profile!.id);

      confetti({ particleCount: 160, spread: 80, origin: { y: 0.3 }, colors: ["#BEFF00", "#7FCC00", "#FFFFFF"] });

      endWorkout();
      router.push("/home");
      toast.success(`Treino salvo!`);
    } catch {
      toast.error("Erro ao salvar treino");
    } finally {
      setSaving(false);
    }
  }

  function handleSetComplete() {
    if (uncompletedSetIndex === -1) return;
    
    haptic(50);
    // Add visual feedback
    const btn = document.getElementById("btn-concluido");
    if (btn) {
      btn.style.transform = "scale(0.9)";
      setTimeout(() => btn.style.transform = "scale(1)", 150);
    }
    
    completeSet(currentExerciseIndex, uncompletedSetIndex);
    
    const isLastSet = uncompletedSetIndex === currentExercise.sets.length - 1;
    const isLastExercise = currentExerciseIndex === exercises.length - 1;

    if (isLastSet && isLastExercise) {
      // Workout completely finished!
      setTimeout(() => setShowSummary(true), 400);
      return;
    }

    // Immediately after completing, trigger rest if configured
    const restTime = currentExercise.restSeconds || defaultRestSeconds;
    if (restTime > 0) {
      startRestTimer(restTime);
    } else {
      // If no rest time, manually advance exercise if needed
      if (isLastSet && !isLastExercise) {
        setCurrentExercise(currentExerciseIndex + 1);
      }
    }
  }

  function handleCancel() {
    if (confirm("Deseja cancelar e descartar este treino?")) {
      endWorkout();
      router.push("/home");
    }
  }

  // Next exercise logic for the Rest View
  const getNextUpText = () => {
    // We already completed a set.
    // If the old currentExercise has uncompleted sets left, we are still on it.
    // But since the completeSet state might have propagated, uncompletedSetIndex might now point to the next set.
    // Wait, completeSet executes synchronously, so currentExercise and uncompletedSetIndex are updated!
    
    let targetEx = currentExercise;
    let targetSetIdx = uncompletedSetIndex;
    let exIdx = currentExerciseIndex;
    
    if (targetSetIdx === -1) {
      // No sets left in current exercise, go to next
      if (exIdx < exercises.length - 1) {
        targetEx = exercises[exIdx + 1];
        targetSetIdx = 0; // Assuming next exercise has uncompleted sets
      }
    }

    if (!targetEx || targetSetIdx === -1) return "Fim do Treino!";
    return `${targetEx.name} (Série ${targetSetIdx + 1})`;
  };

  // --- Rendering Functions ---

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

  if (showTemplatePicker) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: "#0A0A0F" }}>
        <div className="px-5 pt-safe">
          <div className="flex items-center justify-between pt-4 pb-5">
            <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Iniciar Treino</h1>
            <button onClick={() => router.push("/home")} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
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

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#6B6B80" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

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

  const { templateName } = useWorkoutStore.getState();

  // Overview / Edit List mode (Optional if user wants to see everything)
  if (showOverview) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: "#0A0A0F" }}>
        <div className="sticky top-0 z-10 px-4 pt-safe flex items-center justify-between py-4" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setShowOverview(false)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-white">Lista de Exercícios</span>
          <div className="w-10" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {exercises.map((ex, i) => {
            const isCompleted = ex.sets.every(s => s.completed);
            return (
              <div key={i} onClick={() => { setCurrentExercise(i); setShowOverview(false); }} className="glass-card p-4 flex items-center justify-between opacity-100 cursor-pointer transition-transform hover:scale-95" style={{ opacity: isCompleted ? 0.5 : 1 }}>
                <div>
                  <p className="font-bold text-white">{ex.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{ex.sets.filter(s => s.completed).length}/{ex.sets.length} séries</p>
                </div>
                {isCompleted ? <Check className="w-5 h-5 text-[#BEFF00]" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-safe py-6 pt-4 border-t border-white/10 text-center">
            <button onClick={() => setShowSummary(true)} className="btn-primary text-black">
              Finalizar Treino
            </button>
        </div>
      </div>
    );
  }

  // --- Main Focus View ---
  const isResting = restTimerActive;
  
  // Progress computation
  const totalRepsToComplete = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedReps = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const totalProgress = totalRepsToComplete > 0 ? (completedReps / totalRepsToComplete) * 100 : 0;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#0A0A0F" }}>
      {/* Top Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-safe"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center justify-between py-4">
          <button onClick={handleCancel} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-colors">
            <X className="w-5 h-5 " />
          </button>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-center">
               <span className="text-xs font-bold font-mono tracking-widest text-gray-400 opacity-80 uppercase">{templateName}</span>
             </div>
          </div>
          <button onClick={() => setShowOverview(true)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <List className="w-5 h-5 text-white" />
          </button>
        </div>
        {/* Top Progress bar */}
        <div className="h-0.5 rounded-full overflow-hidden bg-white/5 mx-2 mb-2">
          <motion.div
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: "#BEFF00" }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────────────
              REST VIEW 
          ─────────────────────────────────────────────────────────────────── */}
          {isResting ? (
            <motion.div
              key="resting-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
              <div className="flex flex-col items-center flex-1 justify-center">
                <p className="text-sm font-black tracking-[0.3em] mb-12" style={{ color: "#BEFF00" }}>
                  DESCANSO
                </p>

                <div className="relative mb-12 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.02, 1] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="font-mono font-black tabular-nums tracking-tighter"
                    style={{ fontSize: "6rem", lineHeight: 1, color: "#FAFAFA", textShadow: "0 0 40px rgba(190,255,0,0.3)" }}
                  >
                    {formatTimer(restTimeRemaining)}
                  </motion.div>
                </div>

                <div className="flex flex-col items-center gap-1 opacity-60">
                  <p className="text-xs uppercase tracking-widest text-[#6B6B80]">Próximo Exercício</p>
                  <p className="text-lg font-bold text-white text-center">{getNextUpText()}</p>
                </div>
              </div>

              {/* Bottom Buttons for Rest */}
              <div className="w-full pb-safe pt-4 mb-8 flex items-center justify-center gap-4">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => useWorkoutStore.setState({ restTimeRemaining: Math.max(0, restTimeRemaining - 15) })}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold bg-white/5 text-white border border-white/5">
                  -15
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={stopRestTimer}
                  className="flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-lg tracking-wide shadow-lg shadow-[#BEFF00]/20"
                  style={{ background: "#BEFF00", color: "#0A0A0F" }}>
                  PULAR
                  <SkipForward className="w-5 h-5 ml-1" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => useWorkoutStore.setState({ restTimeRemaining: restTimeRemaining + 15 })}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold bg-white/5 text-white border border-white/5">
                  +15
                </motion.button>
              </div>
            </motion.div>
          ) : (
          /* ─────────────────────────────────────────────────────────────────
              ACTIVE SET VIEW 
          ─────────────────────────────────────────────────────────────────── */
            <motion.div // Using uncompletedSetIndex to animate per set change!
              key={`working-view-${currentExercise?.name}-${uncompletedSetIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // smooth spring-like curve
              className="absolute inset-0 flex flex-col pt-8 px-6 pb-safe"
            >
              <div className="flex items-center justify-center gap-2 mb-8">
                 <Timer className="w-4 h-4 text-[#BEFF00]" />
                 <span className="font-mono text-lg font-black text-[#BEFF00] tracking-wider bg-[#BEFF00]/10 px-3 py-1 rounded-full">{formatTimer(elapsed)}</span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-start mt-6">
                <div className="flex gap-2 items-center mb-6">
                  <span className="text-xs font-bold tracking-widest uppercase bg-white/10 px-4 py-1.5 rounded-full text-white/70">
                    Série {uncompletedSetIndex !== -1 ? uncompletedSetIndex + 1 : currentExercise.sets.length} de {currentExercise.sets.length}
                  </span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black text-center text-white break-words tracking-tight leading-[1.1] mb-12">
                  {currentExercise.name}
                </h2>

                {currentSet ? (
                  <div className="w-full flex justify-between items-center gap-4 max-w-sm mx-auto">
                    {/* Weight Control */}
                    <div className="flex-1 flex flex-col items-center bg-white/5 p-4 rounded-3xl border border-white/10">
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">Peso (kg)</p>
                      <div className="flex items-center w-full justify-between gap-1">
                        <button onClick={() => updateSet(currentExerciseIndex, uncompletedSetIndex, { weight: String(Math.max(0, (parseFloat(currentSet.weight || "0") - weightIncrement))) })}
                          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white">
                          <Minus className="w-4 h-4"/>
                        </button>
                        <input
                           type="number"
                           className="bg-transparent text-3xl font-black text-center text-white w-20 outline-none tabular-nums"
                           value={currentSet.weight}
                           onChange={(e) => updateSet(currentExerciseIndex, uncompletedSetIndex, { weight: e.target.value })}
                        />
                        <button onClick={() => updateSet(currentExerciseIndex, uncompletedSetIndex, { weight: String((parseFloat(currentSet.weight || "0") + weightIncrement).toFixed(1)) })}
                          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white">
                          <Plus className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>

                    {/* Reps Control */}
                    <div className="flex-1 flex flex-col items-center bg-white/5 p-4 rounded-3xl border border-white/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#BEFF00]/5" />
                      <p className="text-xs uppercase tracking-widest text-[#BEFF00]/70 mb-2 font-semibold relative z-10">Reps</p>
                      <div className="flex items-center w-full justify-between gap-1 relative z-10">
                        <button onClick={() => updateSet(currentExerciseIndex, uncompletedSetIndex, { reps: String(Math.max(0, (parseInt(currentSet.reps || "0") - 1))) })}
                          className="w-10 h-10 flex items-center justify-center bg-[#BEFF00]/20 rounded-full hover:bg-[#BEFF00]/30 active:scale-95 transition-all text-[#BEFF00]">
                          <Minus className="w-4 h-4"/>
                        </button>
                        <input
                           type="number"
                           className="bg-transparent text-3xl font-black text-center text-[#BEFF00] w-16 outline-none tabular-nums"
                           value={currentSet.reps}
                           onChange={(e) => updateSet(currentExerciseIndex, uncompletedSetIndex, { reps: e.target.value })}
                        />
                        <button onClick={() => updateSet(currentExerciseIndex, uncompletedSetIndex, { reps: String(parseInt(currentSet.reps || "0") + 1) })}
                          className="w-10 h-10 flex items-center justify-center bg-[#BEFF00]/20 rounded-full hover:bg-[#BEFF00]/30 active:scale-95 transition-all text-[#BEFF00]">
                          <Plus className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center w-full">
                     <p className="text-gray-500 font-bold">Todas as séries concluídas.</p>
                  </div>
                )}
              </div>

              {/* Huge Concluído Button */}
              <div className="w-full mt-auto mb-6">
                 {currentExerciseIndex === exercises.length - 1 && uncompletedSetIndex === -1 ? (
                    <motion.button 
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setShowSummary(true)}
                      className="w-full h-20 rounded-3xl flex items-center justify-center text-2xl font-black tracking-wider text-black bg-[#BEFF00] shadow-[0_0_40px_rgba(190,255,0,0.3)] transition-all"
                    >
                      FINALIZAR TREINO
                    </motion.button>
                 ) : (
                    currentSet && (
                      <motion.button 
                        id="btn-concluido"
                        whileTap={{ scale: 0.94 }}
                        onClick={handleSetComplete}
                        className="w-full h-20 rounded-3xl flex items-center justify-center gap-3 text-2xl font-black tracking-wider text-black bg-[#BEFF00] shadow-[0_0_40px_rgba(190,255,0,0.4)] transition-all overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity" />
                        <Check className="w-8 h-8" strokeWidth={3} />
                        CONCLUÍDO
                      </motion.button>
                    )
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
