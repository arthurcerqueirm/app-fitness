"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";

    async function exchange() {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Check if user has a profile — if not, send to onboarding
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        router.replace(profile ? next : "/onboarding");
      } else {
        router.replace("/login");
      }
    }

    exchange();
  }, []);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center"
      style={{ background: "#0A0A0F" }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "#BEFF00", boxShadow: "0 0 30px rgba(190,255,0,0.4)" }}
      >
        <Zap className="w-9 h-9 text-black" fill="black" />
      </motion.div>
      <p className="mt-4 text-sm" style={{ color: "#6B6B80" }}>Entrando no Beast Mode...</p>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
