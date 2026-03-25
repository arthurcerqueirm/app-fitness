"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { ProgressRing } from "./ProgressRing";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  progress?: number;
  color?: string;
  delay?: number;
  decimals?: number;
}

export function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  icon,
  progress,
  color = "#BEFF00",
  delay = 0,
  decimals = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="glass-card p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#6B6B80" }}>
          {label}
        </span>
        {progress !== undefined ? (
          <ProgressRing progress={progress} size={36} strokeWidth={3} color={color}>
            <span className="text-[8px] font-bold" style={{ color }}>
              {Math.round(progress)}%
            </span>
          </ProgressRing>
        ) : (
          icon && <div style={{ color }}>{icon}</div>
        )}
      </div>
      <div className="font-mono text-2xl font-bold" style={{ color: "#FAFAFA" }}>
        <AnimatedNumber value={value} suffix={suffix} prefix={prefix} decimals={decimals} />
      </div>
    </motion.div>
  );
}
