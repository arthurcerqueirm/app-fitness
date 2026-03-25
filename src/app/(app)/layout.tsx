"use client";

import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { BottomNav } from "@/components/ui/BottomNav";
import { useWorkoutStore } from "@/store/workoutStore";

function AppContent({ children }: { children: React.ReactNode }) {
  const { isActive } = useWorkoutStore();

  return (
    <div className="min-h-dvh" style={{ background: "#0A0A0F" }}>
      <main className="relative">{children}</main>
      {!isActive && <BottomNav />}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AppContent>{children}</AppContent>
    </SupabaseProvider>
  );
}
