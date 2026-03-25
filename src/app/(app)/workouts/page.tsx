"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { WorkoutCardSkeleton } from "@/components/ui/SkeletonLoader";
import {
  Plus, Dumbbell, Clock, MoreVertical, Trash2, Edit, Copy, Calendar, ChevronDown, ChevronUp, Play
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { DAY_LABELS } from "@/types";
import type { WorkoutTemplate, TemplateExercise, Exercise } from "@/types";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_COLORS } from "@/types";

type TemplateWithExercises = WorkoutTemplate & {
  template_exercises?: (TemplateExercise & { exercise: Exercise })[];
};

export default function WorkoutsPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [templates, setTemplates] = useState<TemplateWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) loadTemplates();
  }, [profile]);

  async function loadTemplates() {
    setLoading(true);
    const { data } = await supabase
      .from("workout_templates")
      .select(`*, template_exercises(*, exercise:exercises(*))`)
      .eq("user_id", profile!.id)
      .eq("is_active", true)
      .order("sort_order");
    setTemplates((data as TemplateWithExercises[]) ?? []);
    setLoading(false);
  }

  async function deleteTemplate(id: string) {
    await supabase.from("workout_templates").update({ is_active: false }).eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setMenuId(null);
  }

  async function duplicateTemplate(template: TemplateWithExercises) {
    const { data: newTemplate } = await supabase
      .from("workout_templates")
      .insert({
        user_id: profile!.id,
        name: `${template.name} (cópia)`,
        description: template.description,
        color: template.color,
        icon: template.icon,
        day_of_week: template.day_of_week,
        estimated_duration: template.estimated_duration,
        sort_order: templates.length,
        is_active: true,
      })
      .select()
      .single();

    if (newTemplate && template.template_exercises) {
      const exercises = template.template_exercises.map((te) => ({
        template_id: newTemplate.id,
        exercise_id: te.exercise_id,
        sort_order: te.sort_order,
        target_sets: te.target_sets,
        target_reps: te.target_reps,
        target_weight: te.target_weight,
        rest_seconds: te.rest_seconds,
      }));
      await supabase.from("template_exercises").insert(exercises);
    }

    loadTemplates();
    setMenuId(null);
  }

  return (
    <div className="min-h-dvh pb-nav" style={{ background: "#0A0A0F" }}>
      <div className="px-5 pt-safe">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between pt-4 pb-6"
        >
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Meus Treinos</h1>
            <p className="text-sm" style={{ color: "#6B6B80" }}>{templates.length} planos criados</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/workouts/new")}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#BEFF00", boxShadow: "0 0 16px rgba(190,255,0,0.3)" }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        {/* Templates */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <WorkoutCardSkeleton key={i} />)}
          </div>
        ) : templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(190,255,0,0.1)", border: "1px solid rgba(190,255,0,0.2)" }}
            >
              <Dumbbell className="w-10 h-10" style={{ color: "#BEFF00" }} />
            </div>
            <div className="text-center">
              <p className="font-bold mb-1" style={{ color: "#FAFAFA" }}>Nenhum treino criado</p>
              <p className="text-sm" style={{ color: "#6B6B80" }}>Crie seu primeiro plano de treino</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/workouts/new")}
              className="btn-primary"
              style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }}
            >
              <Plus className="w-4 h-4" />
              Criar Treino
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {templates.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: `1px solid ${template.color}33`,
                      background: `linear-gradient(135deg, ${template.color}10, rgba(18,18,26,0.8))`,
                    }}
                  >
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${template.color}22`, border: `1px solid ${template.color}44` }}
                          >
                            <Dumbbell className="w-5 h-5" style={{ color: template.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate" style={{ color: "#FAFAFA" }}>
                              {template.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-0.5">
                              {template.estimated_duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" style={{ color: "#6B6B80" }} />
                                  <span className="text-xs" style={{ color: "#6B6B80" }}>
                                    {formatDuration(template.estimated_duration)}
                                  </span>
                                </div>
                              )}
                              {template.template_exercises && (
                                <span className="text-xs" style={{ color: "#6B6B80" }}>
                                  {template.template_exercises.length} exercícios
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/active?template=${template.id}`)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: template.color }}
                          >
                            <Play className="w-4 h-4 text-black" fill="black" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMenuId(menuId === template.id ? null : template.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <MoreVertical className="w-4 h-4" style={{ color: "#6B6B80" }} />
                          </motion.button>
                        </div>
                      </div>

                      {/* Days */}
                      {template.day_of_week && template.day_of_week.length > 0 && (
                        <div className="flex gap-1.5 mt-3">
                          {DAY_LABELS.map((day, i) => (
                            <div
                              key={day}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                              style={{
                                background: template.day_of_week?.includes(i) ? `${template.color}33` : "rgba(255,255,255,0.04)",
                                color: template.day_of_week?.includes(i) ? template.color : "#3A3A4A",
                                border: template.day_of_week?.includes(i) ? `1px solid ${template.color}55` : "1px solid transparent",
                              }}
                            >
                              {day[0]}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Context Menu */}
                      <AnimatePresence>
                        {menuId === template.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            className="mt-3 rounded-xl overflow-hidden"
                            style={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            <button
                              onClick={() => { router.push(`/workouts/${template.id}`); setMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                              style={{ color: "#FAFAFA" }}
                            >
                              <Edit className="w-4 h-4" style={{ color: "#BEFF00" }} />
                              Editar
                            </button>
                            <button
                              onClick={() => duplicateTemplate(template)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                              style={{ color: "#FAFAFA", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <Copy className="w-4 h-4" style={{ color: "#4ECDC4" }} />
                              Duplicar
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                              style={{ color: "#FF4757", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                        className="mt-3 flex items-center gap-1 text-xs w-full"
                        style={{ color: "#6B6B80" }}
                      >
                        {expandedId === template.id ? (
                          <><ChevronUp className="w-3.5 h-3.5" />Fechar exercícios</>
                        ) : (
                          <><ChevronDown className="w-3.5 h-3.5" />Ver exercícios</>
                        )}
                      </button>
                    </div>

                    {/* Exercises preview */}
                    <AnimatePresence>
                      {expandedId === template.id && template.template_exercises && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="p-4 space-y-2">
                            {template.template_exercises
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((te, idx) => (
                                <motion.div
                                  key={te.id}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  className="flex items-center gap-3"
                                >
                                  <div
                                    className="w-1.5 h-6 rounded-full"
                                    style={{ background: MUSCLE_GROUP_COLORS[te.exercise?.muscle_group ?? "chest"] ?? "#BEFF00" }}
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
                                      {te.exercise?.name}
                                    </span>
                                    <span className="text-xs ml-2" style={{ color: "#6B6B80" }}>
                                      {te.target_sets}×{te.target_reps}
                                    </span>
                                  </div>
                                  <span
                                    className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{
                                      background: `${MUSCLE_GROUP_COLORS[te.exercise?.muscle_group ?? "chest"]}22`,
                                      color: MUSCLE_GROUP_COLORS[te.exercise?.muscle_group ?? "chest"],
                                    }}
                                  >
                                    {MUSCLE_GROUP_LABELS[te.exercise?.muscle_group ?? ""] ?? ""}
                                  </span>
                                </motion.div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
