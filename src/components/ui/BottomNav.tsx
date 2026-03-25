"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart2, Trophy, User, Plus } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/workouts", icon: Dumbbell, label: "Treinos" },
  { href: "/active", icon: Plus, label: "Iniciar", center: true },
  { href: "/progress", icon: BarChart2, label: "Progresso" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          if (item.center) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #BEFF00, #7FCC00)",
                    boxShadow: "0 0 20px rgba(190,255,0,0.4), 0 4px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  <Plus className="w-7 h-7 text-black" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 flex-1 py-1"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="relative">
                  <item.icon
                    className="w-5 h-5 transition-colors duration-200"
                    style={{ color: isActive ? "#BEFF00" : "#6B6B80" }}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#BEFF00" }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium transition-colors duration-200"
                  style={{ color: isActive ? "#BEFF00" : "#6B6B80" }}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
