"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Zap, Target, TrendingUp, Flame, Weight, ChevronRight, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

const GOALS = [
  { value: "hypertrophy", label: "Hipertrofia", desc: "Ganhar massa muscular", icon: "💪", color: "#FF4757" },
  { value: "strength", label: "Força", desc: "Aumentar cargas máximas", icon: "🏋️", color: "#FFA502" },
  { value: "endurance", label: "Resistência", desc: "Melhorar condicionamento", icon: "🏃", color: "#4ECDC4" },
  { value: "weight_loss", label: "Emagrecimento", desc: "Reduzir gordura corporal", icon: "🔥", color: "#2ED573" },
];

const LEVELS = [
  { value: "beginner", label: "Iniciante", desc: "0-1 ano de treino", months: "< 12 meses" },
  { value: "intermediate", label: "Intermediário", desc: "1-3 anos de treino", months: "1-3 anos" },
  { value: "advanced", label: "Avançado", desc: "3+ anos de treino", months: "3+ anos" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? "100%" : "-100%", opacity: 0 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  useEffect(() => {
    const savedName = sessionStorage.getItem("signup_name") || "";
    setName(savedName);
  }, []);

  function next() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function back() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function finish() {
    setLoading(true);
    try {
      // Try session first (works after OAuth or when email confirmation is disabled)
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;

      // Fallback: user ID stored in sessionStorage during registration
      if (!userId) {
        userId = sessionStorage.getItem("signup_user_id") ?? undefined;
      }

      if (!userId) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        name: name || "Atleta",
        goal: goal as "hypertrophy" | "strength" | "endurance" | "weight_loss",
        level: level as "beginner" | "intermediate" | "advanced",
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
      });

      if (error) throw error;
      sessionStorage.removeItem("signup_name");
      sessionStorage.removeItem("signup_user_id");
      router.push("/home");
    } catch (err: unknown) {
      toast.error("Erro ao salvar perfil");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    /* Step 0 — Objetivo */
    <motion.div
      key="goal"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full"
    >
      <div className="mb-8">
        <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#BEFF00" }} />
        <h2 className="text-2xl font-black mb-2" style={{ color: "#FAFAFA" }}>
          Qual é seu objetivo?
        </h2>
        <p className="text-sm" style={{ color: "#6B6B80" }}>
          Vamos personalizar sua experiência
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {GOALS.map((g) => (
          <motion.button
            key={g.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setGoal(g.value); setTimeout(next, 200); }}
            className="glass-card p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200"
            style={{
              border: goal === g.value ? `2px solid ${g.color}` : "1px solid rgba(255,255,255,0.06)",
              boxShadow: goal === g.value ? `0 0 16px ${g.color}33` : undefined,
              minHeight: 120,
            }}
          >
            <span className="text-3xl">{g.icon}</span>
            <span className="font-bold text-sm" style={{ color: "#FAFAFA" }}>{g.label}</span>
            <span className="text-xs" style={{ color: "#6B6B80" }}>{g.desc}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>,

    /* Step 1 — Nível */
    <motion.div
      key="level"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full"
    >
      <div className="mb-8">
        <div className="flex gap-2 mb-6">
          <div className="w-10 h-1 rounded-full" style={{ background: "#BEFF00" }} />
          <div className="w-10 h-1 rounded-full" style={{ background: "#BEFF00" }} />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: "#FAFAFA" }}>
          Seu nível de treino
        </h2>
        <p className="text-sm" style={{ color: "#6B6B80" }}>Seja honesto — isso ajuda muito</p>
      </div>
      <div className="space-y-3 flex-1">
        {LEVELS.map((l) => (
          <motion.button
            key={l.value}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setLevel(l.value); setTimeout(next, 200); }}
            className="w-full glass-card p-5 flex items-center justify-between text-left transition-all duration-200"
            style={{
              border: level === l.value ? "2px solid #BEFF00" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <div className="font-bold mb-1" style={{ color: "#FAFAFA" }}>{l.label}</div>
              <div className="text-sm" style={{ color: "#6B6B80" }}>{l.desc}</div>
            </div>
            <div className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: "rgba(190,255,0,0.1)", color: "#BEFF00" }}>
              {l.months}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>,

    /* Step 2 — Dados */
    <motion.div
      key="data"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full"
    >
      <div className="mb-8">
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-10 h-1 rounded-full" style={{ background: "#BEFF00" }} />
          ))}
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: "#FAFAFA" }}>
          Dados básicos
        </h2>
        <p className="text-sm" style={{ color: "#6B6B80" }}>Para calcular suas metas</p>
      </div>
      <div className="space-y-4 flex-1">
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "#6B6B80" }}>NOME</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "#6B6B80" }}>PESO (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="ex: 75"
            className="input-field"
            step="0.1"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "#6B6B80" }}>ALTURA (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="ex: 175"
            className="input-field"
          />
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={finish}
        disabled={loading || !name}
        className="btn-primary mt-6"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Zap className="w-5 h-5" fill="black" />
            Ativar Beast Mode
          </>
        )}
      </motion.button>
    </motion.div>,
  ];

  return (
    <div
      className="min-h-dvh flex flex-col p-6"
      style={{ background: "#0A0A0F" }}
    >
      <div className="flex items-center justify-between mb-4 pt-safe">
        <button
          onClick={back}
          className="flex items-center gap-1 text-sm"
          style={{ color: "#6B6B80", display: step === 0 ? "none" : "flex" }}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <span className="text-xs font-mono" style={{ color: "#6B6B80" }}>
          {step + 1} / {steps.length}
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}
