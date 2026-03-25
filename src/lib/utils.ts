import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

/** Estima 1RM usando fórmula de Epley */
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/** Formata peso (kg) */
export function formatWeight(weight: number | null | undefined, unit: "kg" | "lbs" = "kg"): string {
  if (!weight) return "-";
  if (unit === "lbs") return `${Math.round(weight * 2.20462)} lbs`;
  return `${weight} kg`;
}

/** Formata duração em minutos para exibição */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Formata volume total */
export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toFixed(0)}kg`;
}

/** Retorna saudação baseada na hora */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Retorna emoji de humor */
export function getMoodEmoji(mood: number): string {
  const emojis = ["😫", "😕", "😐", "😊", "🔥"];
  return emojis[mood - 1] ?? "😐";
}

/** Vibração haptic */
export function haptic(pattern: number | number[] = 50): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

/** Formata timer mm:ss */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Dia da semana atual (0=dom) */
export function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

/** Formata data pt-BR */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Calcula XP baseado no treino */
export function calculateWorkoutXP(sets: number, volume: number, isPR: boolean): number {
  let xp = sets * 5 + Math.floor(volume / 100) * 2;
  if (isPR) xp += 50;
  return xp;
}

/** Nível baseado em XP */
export function getLevelFromXP(xp: number): { level: number; progress: number; nextLevelXP: number } {
  const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000];
  let level = 1;
  for (let i = 0; i < levelThresholds.length - 1; i++) {
    if (xp >= levelThresholds[i + 1]) level = i + 2;
    else break;
  }
  const currentThreshold = levelThresholds[level - 1] ?? 0;
  const nextThreshold = levelThresholds[level] ?? levelThresholds[levelThresholds.length - 1] * 2;
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return { level, progress: Math.min(progress, 100), nextLevelXP: nextThreshold - xp };
}

/** Classnames simples sem clsx */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
