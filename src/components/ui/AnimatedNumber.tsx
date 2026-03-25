"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.2,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest.toFixed(decimals));
      },
    });
    return controls.stop;
  }, [value, duration, decimals]);

  return (
    <span className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
