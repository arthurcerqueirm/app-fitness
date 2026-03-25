"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { getLevelFromXP } from "@/lib/utils";
import { Lock, Zap, Star, Trophy } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
};

type UserAchievement = {
  achievement_id: string;
  unlocked_at: string;
};

const RARITY_COLORS = {
  common: { color: "#9CA3AF", glow: "rgba(156,163,175,0.2)", label: "Comum" },
  rare: { color: "#4ECDC4", glow: "rgba(78,205,196,0.2)", label: "Raro" },
  epic: { color: "#A855F7", glow: "rgba(168,85,247,0.2)", label: "Épico" },
  legendary: { color: "#F59E0B", glow: "rgba(245,158,11,0.3)", label: "Lendário" },
};

const CATEGORY_LABELS: Record<string, string> = {
  streak: "Streak",
  volume: "Volume",
  consistency: "Consistência",
  strength: "Força",
  milestone: "Marcos",
};

const CATEGORIES = ["all", "streak", "volume", "consistency", "strength", "milestone"];

function AchievementCard({ achievement, unlocked, unlockedAt }: {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
}) {
  const rarity = RARITY_COLORS[achievement.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 flex flex-col items-center text-center relative overflow-hidden"
      style={{
        border: unlocked ? `1px solid ${rarity.color}44` : "1px solid rgba(255,255,255,0.06)",
        boxShadow: unlocked ? `0 0 20px ${rarity.glow}` : undefined,
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      {unlocked && achievement.rarity === "legendary" && (
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at 50% 30%, ${rarity.color}, transparent 70%)` }}
        />
      )}

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 relative"
        style={{
          background: unlocked ? `${rarity.color}22` : "rgba(255,255,255,0.04)",
          border: `1px solid ${unlocked ? rarity.color + "44" : "rgba(255,255,255,0.08)"}`,
          filter: unlocked ? undefined : "grayscale(1)",
        }}
      >
        {unlocked ? achievement.icon : <Lock className="w-6 h-6" style={{ color: "#3A3A4A" }} />}
      </div>

      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
        style={{ background: `${rarity.color}22`, color: rarity.color }}
      >
        {rarity.label}
      </span>

      <p className="text-sm font-bold mb-1 leading-tight" style={{ color: unlocked ? "#FAFAFA" : "#6B6B80" }}>
        {achievement.name}
      </p>
      <p className="text-xs" style={{ color: "#6B6B80", lineHeight: 1.4 }}>
        {achievement.description}
      </p>

      {unlocked && (
        <div className="flex items-center gap-1 mt-2">
          <Zap className="w-3 h-3" style={{ color: "#BEFF00" }} />
          <span className="text-xs font-mono font-bold" style={{ color: "#BEFF00" }}>
            +{achievement.xp_reward} XP
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function AchievementsPage() {
  const { profile } = useUserStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    const [achievementsRes, userAchRes] = await Promise.all([
      supabase.from("achievements").select("*").order("requirement_value"),
      supabase.from("user_achievements").select("*").eq("user_id", profile!.id),
    ]);
    setAchievements(achievementsRes.data ?? []);
    setUserAchievements(userAchRes.data ?? []);
    setLoading(false);
  }

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const filtered = achievements.filter(
    (a) => selectedCategory === "all" || a.category === selectedCategory
  );

  const unlockedCount = achievements.filter((a) => unlockedIds.has(a.id)).length;
  const totalXP = userAchievements.reduce((sum, ua) => {
    const ach = achievements.find((a) => a.id === ua.achievement_id);
    return sum + (ach?.xp_reward ?? 0);
  }, 0);

  const { level, progress, nextLevelXP } = getLevelFromXP(profile?.xp ?? 0);

  return (
    <div className="min-h-dvh pb-nav" style={{ background: "#0A0A0F" }}>
      <div className="px-5 pt-safe">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="pt-4 pb-5">
          <h1 className="text-2xl font-black" style={{ color: "#FAFAFA" }}>Conquistas</h1>
          <p className="text-sm" style={{ color: "#6B6B80" }}>
            {unlockedCount}/{achievements.length} desbloqueadas
          </p>
        </motion.div>

        {/* XP Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 mb-5"
          style={{ border: "1px solid rgba(190,255,0,0.15)" }}
        >
          <div className="flex items-center gap-4">
            <ProgressRing progress={progress} size={72} strokeWidth={5} color="#BEFF00">
              <span className="text-sm font-black font-mono" style={{ color: "#BEFF00" }}>
                {level}
              </span>
            </ProgressRing>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4" style={{ color: "#FFA502" }} fill="#FFA502" />
                <span className="font-bold" style={{ color: "#FAFAFA" }}>Nível {level}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #BEFF00, #7FCC00)" }}
                />
              </div>
              <p className="text-xs" style={{ color: "#6B6B80" }}>
                {nextLevelXP} XP para o próximo nível
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" style={{ color: "#BEFF00" }} />
                <span className="font-black font-mono text-xl" style={{ color: "#BEFF00" }}>
                  {profile?.xp ?? 0}
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B6B80" }}>XP Total</p>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Desbloqueadas", value: String(unlockedCount), color: "#BEFF00" },
            { label: "XP de Conquistas", value: String(totalXP), color: "#FFA502" },
            { label: "Restantes", value: String(achievements.length - unlockedCount), color: "#6B6B80" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="glass-card p-3 text-center"
            >
              <p className="text-lg font-black font-mono" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#6B6B80" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: selectedCategory === cat ? "#BEFF00" : "rgba(255,255,255,0.06)",
                color: selectedCategory === cat ? "#0A0A0F" : "#6B6B80",
              }}
            >
              {cat === "all" ? "Todas" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Achievements grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-4 h-40 shimmer" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3 pb-4"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="show"
          >
            {/* Unlocked first */}
            {[
              ...filtered.filter((a) => unlockedIds.has(a.id)),
              ...filtered.filter((a) => !unlockedIds.has(a.id)),
            ].map((achievement, i) => (
              <motion.div
                key={achievement.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.85, y: 16 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
                }}
              >
                <AchievementCard
                  achievement={achievement}
                  unlocked={unlockedIds.has(achievement.id)}
                  unlockedAt={userAchievements.find((ua) => ua.achievement_id === achievement.id)?.unlocked_at}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
