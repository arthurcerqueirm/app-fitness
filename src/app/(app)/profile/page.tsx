"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import {
  User, Weight, Ruler, Target, BarChart2, Clock, Dumbbell, LogOut,
  ChevronRight, Bell, Vibrate, Volume2, Check
} from "lucide-react";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";
import { formatVolume, formatDuration } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile, weightUnit, setWeightUnit, defaultRestSeconds, setDefaultRest, weightIncrement, setWeightIncrement } = useUserStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [weight, setWeight] = useState(String(profile?.weight ?? ""));
  const [height, setHeight] = useState(String(profile?.height ?? ""));
  const [goal, setGoal] = useState<"hypertrophy" | "strength" | "endurance" | "weight_loss">(profile?.goal ?? "hypertrophy");
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        goal: goal as "hypertrophy" | "strength" | "endurance" | "weight_loss",
      };
      await supabase.from("profiles").update(updates).eq("id", profile!.id);
      updateProfile(updates);
      setEditing(false);
      toast.success("Perfil salvo!");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const GOALS: { value: "hypertrophy" | "strength" | "endurance" | "weight_loss"; label: string; icon: string }[] = [
    { value: "hypertrophy", label: "Hipertrofia", icon: "💪" },
    { value: "strength", label: "Força", icon: "🏋️" },
    { value: "endurance", label: "Resistência", icon: "🏃" },
    { value: "weight_loss", label: "Emagrecimento", icon: "🔥" },
  ];

  return (
    <div className="min-h-dvh pb-nav" style={{ background: "#0A0A0F" }}>
      <div className="px-5 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-5">
          <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Perfil</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setEditing(!editing); if (editing) { setName(profile?.name ?? ""); setWeight(String(profile?.weight ?? "")); setHeight(String(profile?.height ?? "")); } }}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: editing ? "rgba(255,71,87,0.15)" : "rgba(190,255,0,0.15)",
              color: editing ? "#FF4757" : "#BEFF00",
            }}
          >
            {editing ? "Cancelar" : "Editar"}
          </motion.button>
        </div>

        {/* Avatar & Name */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black"
            style={{
              background: "linear-gradient(135deg, rgba(190,255,0,0.2), rgba(190,255,0,0.05))",
              border: "2px solid rgba(190,255,0,0.3)",
            }}
          >
            {profile?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-xl font-bold"
                style={{ padding: "8px 12px" }}
              />
            ) : (
              <h2 className="text-xl font-black" style={{ color: "#FAFAFA" }}>{profile?.name}</h2>
            )}
            <p className="text-sm mt-0.5" style={{ color: "#6B6B80" }}>
              {profile?.level ? LEVEL_LABELS[profile.level] : ""}
              {profile?.goal ? ` · ${GOAL_LABELS[profile.goal]}` : ""}
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Treinos", value: String(profile?.total_workouts ?? 0), icon: <Dumbbell className="w-4 h-4" style={{ color: "#BEFF00" }} /> },
            { label: "Volume", value: formatVolume(profile?.total_volume ?? 0), icon: <BarChart2 className="w-4 h-4" style={{ color: "#FF4757" }} /> },
            { label: "Tempo", value: formatDuration(profile?.total_time_minutes ?? 0), icon: <Clock className="w-4 h-4" style={{ color: "#FFA502" }} /> },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-3 text-center"
            >
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className="font-black font-mono text-lg" style={{ color: "#FAFAFA" }}>{stat.value}</p>
              <p className="text-[10px]" style={{ color: "#6B6B80" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Edit fields */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B6B80" }}>PESO (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="input-field"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B6B80" }}>ALTURA (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-3 block" style={{ color: "#6B6B80" }}>OBJETIVO</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <motion.button
                      key={g.value}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setGoal(g.value)}
                      className="p-3 rounded-xl flex items-center gap-2 transition-all"
                      style={{
                        background: goal === g.value ? "rgba(190,255,0,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${goal === g.value ? "rgba(190,255,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <span>{g.icon}</span>
                      <span className="text-sm font-medium" style={{ color: goal === g.value ? "#BEFF00" : "#FAFAFA" }}>
                        {g.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" />Salvar Perfil</>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <div className="mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "#6B6B80" }}>CONFIGURAÇÕES</p>

          <div className="space-y-2">
            {/* Weight unit */}
            <div className="glass-card p-4 flex items-center justify-between">
              <span className="text-sm" style={{ color: "#FAFAFA" }}>Unidade de peso</span>
              <div className="flex glass-card p-0.5 gap-0.5">
                {(["kg", "lbs"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setWeightUnit(unit)}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: weightUnit === unit ? "#BEFF00" : "transparent",
                      color: weightUnit === unit ? "#0A0A0F" : "#6B6B80",
                    }}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight increment */}
            <div className="glass-card p-4 flex items-center justify-between">
              <span className="text-sm" style={{ color: "#FAFAFA" }}>Incremento de peso</span>
              <div className="flex glass-card p-0.5 gap-0.5">
                {[1, 2.5, 5].map((inc) => (
                  <button
                    key={inc}
                    onClick={() => setWeightIncrement(inc)}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: weightIncrement === inc ? "#BEFF00" : "transparent",
                      color: weightIncrement === inc ? "#0A0A0F" : "#6B6B80",
                    }}
                  >
                    {inc}kg
                  </button>
                ))}
              </div>
            </div>

            {/* Rest time */}
            <div className="glass-card p-4 flex items-center justify-between">
              <span className="text-sm" style={{ color: "#FAFAFA" }}>Descanso padrão</span>
              <div className="flex glass-card p-0.5 gap-0.5">
                {[60, 90, 120, 180].map((s) => (
                  <button
                    key={s}
                    onClick={() => setDefaultRest(s)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: defaultRestSeconds === s ? "#BEFF00" : "transparent",
                      color: defaultRestSeconds === s ? "#0A0A0F" : "#6B6B80",
                    }}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mb-8">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl"
            style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)" }}
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" style={{ color: "#FF4757" }} />
              <span className="font-semibold" style={{ color: "#FF4757" }}>Sair da Conta</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "#FF4757" }} />
          </motion.button>
        </div>
      </div>

      {/* Logout confirmation */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.8)" }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="w-full rounded-t-3xl p-6 space-y-4"
              style={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3 className="font-bold text-lg text-center" style={{ color: "#FAFAFA" }}>Sair da conta?</h3>
              <p className="text-sm text-center" style={{ color: "#6B6B80" }}>Tem certeza? Seus dados ficam salvos.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,71,87,0.15)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.3)" }}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
