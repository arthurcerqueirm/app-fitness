"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { TrendingUp, TrendingDown, Dumbbell, BarChart2, Weight, Calendar, Plus } from "lucide-react";
import { formatVolume, formatDuration } from "@/lib/utils";
import { MUSCLE_GROUP_LABELS } from "@/types";
import toast from "react-hot-toast";

const TABS = [
  { id: "volume", label: "Volume", icon: BarChart2 },
  { id: "forca", label: "Força", icon: Dumbbell },
  { id: "corpo", label: "Corpo", icon: Weight },
  { id: "geral", label: "Geral", icon: Calendar },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl p-3" style={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-xs mb-1" style={{ color: "#6B6B80" }}>{label}</p>
        <p className="font-bold font-mono" style={{ color: "#BEFF00" }}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function ProgressPage() {
  const { profile } = useUserStore();
  const [activeTab, setActiveTab] = useState("volume");
  const [weeklyData, setWeeklyData] = useState<{ week: string; volume: number; workouts: number }[]>([]);
  const [muscleData, setMuscleData] = useState<{ muscle: string; value: number }[]>([]);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight: number }[]>([]);
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [strengthData, setStrengthData] = useState<{ date: string; weight: number; reps: number; oneRM: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  useEffect(() => {
    if (selectedExercise) loadStrengthData(selectedExercise);
  }, [selectedExercise]);

  async function loadData() {
    setLoading(true);
    try {
      const [sessionsRes, setsRes, weightRes, exercisesRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("user_id", profile!.id)
          .eq("is_completed", true)
          .order("started_at")
          .gte("started_at", new Date(Date.now() - 84 * 24 * 3600 * 1000).toISOString()),
        supabase
          .from("workout_sets")
          .select("*, workout_sessions!inner(user_id, started_at), exercise:exercises(muscle_group)")
          .eq("workout_sessions.user_id", profile!.id)
          .gte("workout_sessions.started_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
        supabase.from("weight_log").select("*").eq("user_id", profile!.id).order("logged_at").limit(60),
        supabase.from("exercises").select("id, name").order("name"),
      ]);

      // Weekly volume
      const sessions = sessionsRes.data ?? [];
      const weeklyMap = new Map<string, { volume: number; workouts: number }>();
      sessions.forEach((s) => {
        const d = new Date(s.started_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        const existing = weeklyMap.get(key) ?? { volume: 0, workouts: 0 };
        weeklyMap.set(key, { volume: existing.volume + (s.total_volume ?? 0), workouts: existing.workouts + 1 });
      });
      setWeeklyData(Array.from(weeklyMap.entries()).slice(-12).map(([week, d]) => ({ week, ...d })));

      // Muscle group distribution
      const muscleMap = new Map<string, number>();
      (setsRes.data ?? []).forEach((s: any) => {
        const muscle = s.exercise?.muscle_group ?? "outros";
        const vol = (s.weight ?? 0) * (s.reps ?? 0);
        muscleMap.set(muscle, (muscleMap.get(muscle) ?? 0) + vol);
      });
      setMuscleData(
        Array.from(muscleMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([muscle, value]) => ({ muscle: MUSCLE_GROUP_LABELS[muscle] ?? muscle, value: Math.round(value) }))
      );

      // Weight history
      setWeightHistory(
        (weightRes.data ?? []).map((w: any) => ({
          date: new Date(w.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          weight: w.weight,
        }))
      );

      setExercises(exercisesRes.data ?? []);
      if (exercisesRes.data?.[0]) setSelectedExercise(exercisesRes.data[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function loadStrengthData(exerciseId: string) {
    const { data } = await supabase
      .from("workout_sets")
      .select("*, session:workout_sessions!inner(started_at, user_id)")
      .eq("exercise_id", exerciseId)
      .eq("workout_sessions.user_id", profile!.id)
      .order("workout_sessions.started_at")
      .limit(50);

    const grouped = new Map<string, { maxWeight: number; maxReps: number }>();
    (data ?? []).forEach((s: any) => {
      const date = new Date(s.session.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      const existing = grouped.get(date) ?? { maxWeight: 0, maxReps: 0 };
      grouped.set(date, {
        maxWeight: Math.max(existing.maxWeight, s.weight ?? 0),
        maxReps: Math.max(existing.maxReps, s.reps ?? 0),
      });
    });

    setStrengthData(
      Array.from(grouped.entries()).map(([date, d]) => ({
        date,
        weight: d.maxWeight,
        reps: d.maxReps,
        oneRM: Math.round(d.maxWeight * (1 + d.maxReps / 30)),
      }))
    );
  }

  async function logWeight() {
    if (!newWeight) return;
    await supabase.from("weight_log").insert({
      user_id: profile!.id,
      weight: parseFloat(newWeight),
    });
    toast.success("Peso registrado!");
    setShowWeightModal(false);
    setNewWeight("");
    loadData();
  }

  const latestWeight = weightHistory[weightHistory.length - 1]?.weight;
  const prevWeight = weightHistory[weightHistory.length - 2]?.weight;
  const weightDiff = latestWeight && prevWeight ? latestWeight - prevWeight : null;

  return (
    <div className="min-h-dvh pb-nav" style={{ background: "#0A0A0F" }}>
      <div className="px-5 pt-safe">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="pt-4 pb-5">
          <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Progresso</h1>
          <p className="text-sm" style={{ color: "#6B6B80" }}>Sua evolução em dados</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 glass-card p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
              style={{
                background: activeTab === tab.id ? "#BEFF00" : "transparent",
                color: activeTab === tab.id ? "#0A0A0F" : "#6B6B80",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Volume Tab */}
          {activeTab === "volume" && (
            <motion.div key="volume" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-card p-4 mb-4">
                <p className="text-xs font-semibold mb-4" style={{ color: "#6B6B80" }}>VOLUME SEMANAL (últimas 12 semanas)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" tick={{ fill: "#6B6B80", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#6B6B80", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" fill="#BEFF00" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-4 mb-4">
                <p className="text-xs font-semibold mb-4" style={{ color: "#6B6B80" }}>VOLUME POR MÚSCULO (últimos 30 dias)</p>
                {muscleData.length > 0 ? (
                  <div className="space-y-3">
                    {muscleData.map((item, i) => {
                      const max = muscleData[0].value;
                      return (
                        <div key={item.muscle} className="flex items-center gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: "#6B6B80" }}>{item.muscle}</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.value / max) * 100}%` }}
                              transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: "linear-gradient(90deg, #BEFF00, #7FCC00)" }}
                            />
                          </div>
                          <span className="text-xs font-mono w-14 text-right" style={{ color: "#FAFAFA" }}>
                            {formatVolume(item.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: "#6B6B80" }}>Nenhum dado ainda</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Força Tab */}
          {activeTab === "forca" && (
            <motion.div key="forca" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-card p-4 mb-4">
                <p className="text-xs font-semibold mb-3" style={{ color: "#6B6B80" }}>EXERCÍCIO</p>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="input-field"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  {exercises.map((e) => (
                    <option key={e.id} value={e.id} style={{ background: "#12121A" }}>{e.name}</option>
                  ))}
                </select>
              </div>

              {strengthData.length > 0 ? (
                <>
                  <div className="glass-card p-4 mb-4">
                    <p className="text-xs font-semibold mb-4" style={{ color: "#6B6B80" }}>1RM ESTIMADO (kg)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={strengthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fill: "#6B6B80", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#6B6B80", fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="oneRM"
                          stroke="#BEFF00"
                          strokeWidth={2}
                          dot={{ fill: "#BEFF00", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="glass-card p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs" style={{ color: "#6B6B80" }}>1RM ATUAL</p>
                        <p className="text-2xl font-black font-mono mt-1" style={{ color: "#BEFF00" }}>
                          {strengthData[strengthData.length - 1]?.oneRM}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "#6B6B80" }}>PESO MÁX</p>
                        <p className="text-2xl font-black font-mono mt-1" style={{ color: "#FAFAFA" }}>
                          {strengthData[strengthData.length - 1]?.weight}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "#6B6B80" }}>REPS MÁX</p>
                        <p className="text-2xl font-black font-mono mt-1" style={{ color: "#FAFAFA" }}>
                          {strengthData[strengthData.length - 1]?.reps}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card p-8 text-center">
                  <p style={{ color: "#6B6B80" }}>Sem dados para este exercício ainda</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Corpo Tab */}
          {activeTab === "corpo" && (
            <motion.div key="corpo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Current weight */}
              <div className="flex gap-3 mb-4">
                <div className="glass-card p-4 flex-1">
                  <p className="text-xs mb-1" style={{ color: "#6B6B80" }}>PESO ATUAL</p>
                  <p className="text-3xl font-black font-mono" style={{ color: "#FAFAFA" }}>
                    {latestWeight ?? profile?.weight ?? "—"}
                    <span className="text-sm font-normal ml-1" style={{ color: "#6B6B80" }}>kg</span>
                  </p>
                  {weightDiff !== null && (
                    <div className="flex items-center gap-1 mt-1">
                      {weightDiff > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" style={{ color: "#FF4757" }} />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" style={{ color: "#2ED573" }} />
                      )}
                      <span className="text-xs font-mono font-bold" style={{ color: weightDiff > 0 ? "#FF4757" : "#2ED573" }}>
                        {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)}kg
                      </span>
                    </div>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWeightModal(true)}
                  className="glass-card p-4 flex flex-col items-center justify-center gap-1"
                  style={{ minWidth: 80 }}
                >
                  <Plus className="w-5 h-5" style={{ color: "#BEFF00" }} />
                  <span className="text-xs" style={{ color: "#6B6B80" }}>Registrar</span>
                </motion.button>
              </div>

              {weightHistory.length > 1 && (
                <div className="glass-card p-4 mb-4">
                  <p className="text-xs font-semibold mb-4" style={{ color: "#6B6B80" }}>HISTÓRICO DE PESO</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={weightHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: "#6B6B80", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#6B6B80", fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#4ECDC4"
                        strokeWidth={2}
                        dot={{ fill: "#4ECDC4", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {weightHistory.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <p style={{ color: "#6B6B80" }}>Nenhum registro de peso ainda.</p>
                  <button onClick={() => setShowWeightModal(true)} className="btn-primary mt-4" style={{ width: "auto", margin: "16px auto 0" }}>
                    Registrar agora
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Geral Tab */}
          {activeTab === "geral" && (
            <motion.div key="geral" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Total de Treinos", value: String(profile?.total_workouts ?? 0), color: "#BEFF00" },
                  { label: "Volume Total", value: formatVolume(profile?.total_volume ?? 0), color: "#FF4757" },
                  { label: "Horas Treinadas", value: `${Math.round((profile?.total_time_minutes ?? 0) / 60)}h`, color: "#FFA502" },
                  { label: "Maior Streak", value: `${profile?.longest_streak ?? 0} dias`, color: "#4ECDC4" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card p-4"
                  >
                    <p className="text-xs mb-2" style={{ color: "#6B6B80" }}>{stat.label}</p>
                    <p className="text-2xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="glass-card p-4 mb-4">
                <p className="text-xs font-semibold mb-4" style={{ color: "#6B6B80" }}>TREINOS POR SEMANA</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyData.slice(-8)} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" tick={{ fill: "#6B6B80", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#6B6B80", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="workouts" fill="#4ECDC4" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weight Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowWeightModal(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="w-full rounded-t-3xl p-6"
              style={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3 className="font-bold text-lg mb-4" style={{ color: "#FAFAFA" }}>Registrar Peso</h3>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="ex: 75.5"
                className="input-field mb-4"
                autoFocus
                step="0.1"
              />
              <button onClick={logWeight} className="btn-primary">Registrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
