"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import {
  ArrowLeft, Plus, Trash2, Search, X, Check
} from "lucide-react";
import { DAY_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_COLORS, EQUIPMENT_LABELS } from "@/types";
import type { Exercise, TemplateExercise } from "@/types";
import toast from "react-hot-toast";

const COLORS = ["#BEFF00", "#FF4757", "#4ECDC4", "#FFA502", "#A855F7", "#2ED573", "#FF6B9D", "#00CEC9"];
const MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "abs", "cardio", "full_body"];

interface TemplateExerciseWithExercise extends TemplateExercise {
  exercise: Exercise;
}

export function WorkoutEditorComponent({ templateId }: { templateId: string }) {
  const router = useRouter();
  const { profile } = useUserStore();
  const isNew = templateId === "new";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#BEFF00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [estimatedDuration, setEstimatedDuration] = useState("60");
  const [templateExercises, setTemplateExercises] = useState<TemplateExerciseWithExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");

  useEffect(() => {
    loadExercises();
    if (!isNew) loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    const { data } = await supabase
      .from("workout_templates")
      .select(`*, template_exercises(*, exercise:exercises(*))`)
      .eq("id", templateId)
      .single();
    if (data) {
      setName(data.name);
      setDescription(data.description ?? "");
      setColor(data.color);
      setDaysOfWeek(data.day_of_week ?? []);
      setEstimatedDuration(String(data.estimated_duration ?? 60));
      const sorted = ((data.template_exercises ?? []) as TemplateExerciseWithExercise[])
        .sort((a: TemplateExerciseWithExercise, b: TemplateExerciseWithExercise) => a.sort_order - b.sort_order);
      setTemplateExercises(sorted);
    }
  }

  async function loadExercises() {
    const { data } = await supabase.from("exercises").select("*").order("name");
    setAllExercises(data ?? []);
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addExercise(exercise: Exercise) {
    const newTE: TemplateExerciseWithExercise = {
      id: crypto.randomUUID(),
      template_id: isNew ? "" : templateId,
      exercise_id: exercise.id,
      sort_order: templateExercises.length,
      target_sets: 3,
      target_reps: "12",
      target_weight: null,
      target_rpe: null,
      rest_seconds: exercise.is_compound ? 180 : 90,
      superset_group: null,
      notes: null,
      exercise,
    };
    setTemplateExercises((prev) => [...prev, newTE]);
    setShowExercisePicker(false);
    setSearchQuery("");
  }

  function removeExercise(idx: number) {
    setTemplateExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, field: string, value: unknown) {
    setTemplateExercises((prev) =>
      prev.map((te, i) => i === idx ? { ...te, [field]: value } : te)
    );
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    try {
      let tid: string;
      if (isNew) {
        const { data, error } = await supabase
          .from("workout_templates")
          .insert({
            user_id: profile!.id,
            name,
            description: description || null,
            color,
            icon: "dumbbell",
            day_of_week: daysOfWeek,
            estimated_duration: parseInt(estimatedDuration) || 60,
            sort_order: 0,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        tid = data.id;
      } else {
        await supabase.from("workout_templates").update({
          name,
          description: description || null,
          color,
          day_of_week: daysOfWeek,
          estimated_duration: parseInt(estimatedDuration) || 60,
        }).eq("id", templateId);
        tid = templateId;
        await supabase.from("template_exercises").delete().eq("template_id", tid);
      }

      if (templateExercises.length > 0) {
        await supabase.from("template_exercises").insert(
          templateExercises.map((te, i) => ({
            template_id: tid,
            exercise_id: te.exercise_id,
            sort_order: i,
            target_sets: te.target_sets,
            target_reps: te.target_reps,
            target_weight: te.target_weight,
            target_rpe: te.target_rpe,
            rest_seconds: te.rest_seconds,
            superset_group: te.superset_group,
            notes: te.notes,
          }))
        );
      }

      toast.success(isNew ? "Treino criado! 🔥" : "Treino salvo!");
      router.push("/workouts");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const filteredExercises = allExercises.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMuscle = !filterMuscle || e.muscle_group === filterMuscle;
    return matchSearch && matchMuscle;
  });

  return (
    <div className="min-h-dvh pb-nav" style={{ background: "#0A0A0F" }}>
      <div className="px-5 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-4">
          <button onClick={() => router.back()} style={{ color: "#6B6B80" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: "#FAFAFA" }}>
            {isNew ? "Novo Treino" : "Editar Treino"}
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#BEFF00", color: "#0A0A0F" }}
          >
            {saving ? "..." : "Salvar"}
          </motion.button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B6B80" }}>NOME DO TREINO</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Treino A — Peito e Tríceps"
              className="input-field"
              style={{ fontSize: "1.1rem", fontWeight: 700 }}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#6B6B80" }}>COR</label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setColor(c)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: c, boxShadow: color === c ? `0 0 14px ${c}` : undefined }}
                >
                  {color === c && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#6B6B80" }}>DIAS DA SEMANA</label>
            <div className="flex gap-2">
              {DAY_LABELS.map((day, i) => (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleDay(i)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: daysOfWeek.includes(i) ? color : "rgba(255,255,255,0.04)",
                    color: daysOfWeek.includes(i) ? "#0A0A0F" : "#6B6B80",
                  }}
                >
                  {day}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B6B80" }}>DURAÇÃO ESTIMADA (min)</label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B6B80" }}>DESCRIÇÃO (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Foco, objetivo..."
              className="input-field resize-none"
              rows={2}
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold" style={{ color: "#6B6B80" }}>
                EXERCÍCIOS ({templateExercises.length})
              </label>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {templateExercises.map((te, idx) => (
                  <motion.div
                    key={te.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 self-stretch rounded-full flex-shrink-0"
                        style={{ background: MUSCLE_GROUP_COLORS[te.exercise.muscle_group] ?? "#BEFF00" }} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-sm" style={{ color: "#FAFAFA" }}>{te.exercise.name}</p>
                            <p className="text-xs" style={{ color: "#6B6B80" }}>
                              {MUSCLE_GROUP_LABELS[te.exercise.muscle_group]}
                              {te.exercise.equipment ? ` • ${EQUIPMENT_LABELS[te.exercise.equipment] ?? te.exercise.equipment}` : ""}
                            </p>
                          </div>
                          <button onClick={() => removeExercise(idx)}>
                            <Trash2 className="w-4 h-4" style={{ color: "#FF4757" }} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] mb-1 block" style={{ color: "#6B6B80" }}>SÉRIES</label>
                            <input
                              type="number"
                              value={te.target_sets}
                              onChange={(e) => updateExercise(idx, "target_sets", parseInt(e.target.value) || 3)}
                              className="input-field text-center text-sm"
                              style={{ padding: "8px" }}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] mb-1 block" style={{ color: "#6B6B80" }}>REPS</label>
                            <input
                              value={te.target_reps}
                              onChange={(e) => updateExercise(idx, "target_reps", e.target.value)}
                              placeholder="12"
                              className="input-field text-center text-sm"
                              style={{ padding: "8px" }}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] mb-1 block" style={{ color: "#6B6B80" }}>DESCANSO(s)</label>
                            <input
                              type="number"
                              value={te.rest_seconds}
                              onChange={(e) => updateExercise(idx, "rest_seconds", parseInt(e.target.value) || 90)}
                              className="input-field text-center text-sm"
                              style={{ padding: "8px" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowExercisePicker(true)}
              className="btn-secondary mt-3"
            >
              <Plus className="w-4 h-4" />
              Adicionar Exercício
            </motion.button>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      <AnimatePresence>
        {showExercisePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowExercisePicker(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
              style={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "88dvh" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="font-bold text-lg" style={{ color: "#FAFAFA" }}>Adicionar Exercício</h3>
                <button onClick={() => setShowExercisePicker(false)}>
                  <X className="w-5 h-5" style={{ color: "#6B6B80" }} />
                </button>
              </div>

              <div className="px-5 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B6B80" }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar exercício..."
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="px-5 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <button
                  onClick={() => setFilterMuscle("")}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{ background: !filterMuscle ? "#BEFF00" : "rgba(255,255,255,0.06)", color: !filterMuscle ? "#0A0A0F" : "#6B6B80" }}
                >
                  Todos
                </button>
                {MUSCLE_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setFilterMuscle(g === filterMuscle ? "" : g)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
                    style={{
                      background: filterMuscle === g ? `${MUSCLE_GROUP_COLORS[g]}33` : "rgba(255,255,255,0.06)",
                      color: filterMuscle === g ? MUSCLE_GROUP_COLORS[g] : "#6B6B80",
                    }}
                  >
                    {MUSCLE_GROUP_LABELS[g]}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2">
                {filteredExercises.map((exercise) => {
                  const alreadyAdded = templateExercises.some((te) => te.exercise_id === exercise.id);
                  return (
                    <motion.button
                      key={exercise.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !alreadyAdded && addExercise(exercise)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                      style={{
                        background: alreadyAdded ? "rgba(190,255,0,0.06)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${alreadyAdded ? "rgba(190,255,0,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{ background: MUSCLE_GROUP_COLORS[exercise.muscle_group] ?? "#BEFF00" }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "#FAFAFA" }}>{exercise.name}</p>
                        <p className="text-xs" style={{ color: "#6B6B80" }}>
                          {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                          {exercise.equipment ? ` • ${EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}` : ""}
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#BEFF00" }} />
                      ) : exercise.is_compound ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(255,165,2,0.15)", color: "#FFA502" }}>
                          Composto
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
