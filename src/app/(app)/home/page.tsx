"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useUserStore } from "@/store/userStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { WorkoutCardSkeleton, StatCardSkeleton } from "@/components/ui/SkeletonLoader";
import {
  Flame, Dumbbell, Clock, TrendingUp, Zap, ChevronRight, Calendar, Play, Target
} from "lucide-react";
import {
  getGreeting, formatDuration, formatVolume, getTodayDayOfWeek, formatDate
} from "@/lib/utils";
import { DAY_LABELS } from "@/types";
import type { WorkoutTemplate, WorkoutSession } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useUserStore();
  const { session, isLoading: sessionLoading } = useSupabase();
  const { isActive } = useWorkoutStore();

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [weekStats, setWeekStats] = useState({ workouts: 0, volume: 0, minutes: 0 });
  const [weekDays, setWeekDays] = useState<boolean[]>(Array(7).fill(false));
  const [loading, setLoading] = useState(true);
  const today = getTodayDayOfWeek();

  useEffect(() => {
    if (authLoading || sessionLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (!profile) {
      router.push("/onboarding");
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, session, authLoading, sessionLoading]);

  useEffect(() => {
    if (isActive) router.push("/active");
  }, [isActive]);

  async function loadData() {
    setLoading(true);
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const [templatesRes, sessionsRes, weekRes] = await Promise.all([
        supabase.from("workout_templates").select("*").eq("user_id", profile!.id).eq("is_active", true).order("sort_order"),
        supabase.from("workout_sessions").select("*").eq("user_id", profile!.id).eq("is_completed", true).order("started_at", { ascending: false }).limit(5),
        supabase.from("workout_sessions").select("*").eq("user_id", profile!.id).eq("is_completed", true).gte("started_at", weekStart.toISOString()),
      ]);

      setTemplates(templatesRes.data ?? []);
      setRecentSessions(sessionsRes.data ?? []);

      const sessions = weekRes.data ?? [];
      const totalVolume = sessions.reduce((s, r) => s + (r.total_volume ?? 0), 0);
      const totalMinutes = sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
      setWeekStats({ workouts: sessions.length, volume: totalVolume, minutes: totalMinutes });

      // Mark days with workouts
      const days = Array(7).fill(false);
      sessions.forEach((s) => {
        const d = new Date(s.started_at).getDay();
        days[d] = true;
      });
      setWeekDays(days);
    } finally {
      setLoading(false);
    }
  }

  // Today's scheduled template
  const todayTemplate = templates.find((t) => t.day_of_week?.includes(today));

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-dvh pb-nav" style={{ background: "#0A0A0F" }}>
      <div className="px-5 pt-safe">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between pt-4 pb-6"
        >
          <div>
            <p className="text-sm" style={{ color: "#6B6B80" }}>{getGreeting()}</p>
            <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>
              {profile?.name?.split(" ")[0] ?? "Atleta"} 👊
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.2)" }}>
              <Flame className="w-4 h-4" style={{ color: "#FF4757" }} />
              <span className="text-sm font-bold font-mono" style={{ color: "#FF4757" }}>
                {profile?.streak_count ?? 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Today's Workout Hero */}
        {loading ? (
          <WorkoutCardSkeleton />
        ) : todayTemplate ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl p-5 mb-6"
            style={{
              background: `linear-gradient(135deg, ${todayTemplate.color}22, ${todayTemplate.color}08)`,
              border: `1px solid ${todayTemplate.color}44`,
              boxShadow: `0 0 30px ${todayTemplate.color}15`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: todayTemplate.color }}>
                  TREINO DE HOJE
                </p>
                <h2 className="text-xl font-black mb-1" style={{ color: "#FAFAFA" }}>
                  {todayTemplate.name}
                </h2>
                {todayTemplate.estimated_duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: "#6B6B80" }} />
                    <span className="text-sm" style={{ color: "#6B6B80" }}>
                      ~{formatDuration(todayTemplate.estimated_duration)}
                    </span>
                  </div>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${todayTemplate.color}22`, border: `1px solid ${todayTemplate.color}44` }}
              >
                <Dumbbell className="w-6 h-6" style={{ color: todayTemplate.color }} />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/active?template=${todayTemplate.id}`)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm tracking-wider"
              style={{ background: todayTemplate.color, color: "#0A0A0F" }}
            >
              <Play className="w-5 h-5" fill="#0A0A0F" />
              INICIAR TREINO
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 mb-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#6B6B80" }}>Nenhum treino hoje</p>
              <p className="text-xs" style={{ color: "#3A3A4A" }}>Que tal um treino livre?</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/active")}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: "#BEFF00", color: "#0A0A0F" }}
            >
              <Play className="w-4 h-4" fill="#0A0A0F" />
              Iniciar
            </motion.button>
          </motion.div>
        )}

        {/* Weekly Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 mb-5"
        >
          <p className="text-xs font-semibold mb-3" style={{ color: "#6B6B80" }}>ESTA SEMANA</p>
          <div className="flex justify-between">
            {DAY_LABELS.map((day, i) => {
              const isToday = i === today;
              const trained = weekDays[i];
              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium" style={{ color: isToday ? "#FAFAFA" : "#6B6B80" }}>
                    {day}
                  </span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: trained ? "#BEFF00" : isToday ? "rgba(190,255,0,0.15)" : "rgba(255,255,255,0.04)",
                      border: isToday ? "2px solid rgba(190,255,0,0.4)" : "none",
                    }}
                  >
                    {trained && <div className="w-2 h-2 rounded-full bg-black" />}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Row */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[0, 1, 2].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 gap-3 mb-5"
          >
            <motion.div variants={itemVariants}>
              <StatCard
                label="Treinos"
                value={weekStats.workouts}
                icon={<Dumbbell className="w-4 h-4" />}
                progress={(weekStats.workouts / 6) * 100}
                delay={0.25}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label="Volume (kg)"
                value={weekStats.volume}
                icon={<TrendingUp className="w-4 h-4" />}
                color="#FF4757"
                delay={0.3}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label="Minutos"
                value={weekStats.minutes}
                icon={<Clock className="w-4 h-4" />}
                color="#FFA502"
                delay={0.35}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Recent Workouts */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: "#6B6B80" }}>HISTÓRICO RECENTE</p>
              <button
                onClick={() => router.push("/progress")}
                className="flex items-center gap-1 text-xs"
                style={{ color: "#BEFF00" }}
              >
                Ver tudo <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(190,255,0,0.1)" }}
                    >
                      <Dumbbell className="w-5 h-5" style={{ color: "#BEFF00" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#FAFAFA" }}>{session.name}</p>
                      <p className="text-xs" style={{ color: "#6B6B80" }}>{formatDate(session.started_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold" style={{ color: "#BEFF00" }}>
                      {formatVolume(session.total_volume)}
                    </p>
                    <p className="text-xs" style={{ color: "#6B6B80" }}>
                      {session.duration_minutes ? formatDuration(session.duration_minutes) : "-"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* XP Bar */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="glass-card p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#BEFF00" }} />
                <span className="text-xs font-semibold" style={{ color: "#6B6B80" }}>NÍVEL & XP</span>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: "#BEFF00" }}>
                {profile.xp} XP
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((profile.xp % 500) / 5, 100)}%` }}
                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #BEFF00, #7FCC00)" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
