"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        sessionStorage.setItem("signup_name", name);
        sessionStorage.setItem("signup_user_id", data.user.id);
        if (data.session) {
          // Email confirmation disabled — go straight to onboarding
          router.push("/onboarding");
        } else {
          // Email confirmation required — show confirmation screen
          setEmailSent(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      toast.error(message.includes("already registered") ? "Email já cadastrado" : message);
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center p-6"
        style={{ background: "#0A0A0F" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(190,255,0,0.1)", border: "2px solid rgba(190,255,0,0.3)" }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "#BEFF00" }} />
          </motion.div>

          <h2 className="text-2xl font-black mb-3" style={{ color: "#FAFAFA" }}>
            Verifique seu email
          </h2>
          <p className="text-sm mb-2" style={{ color: "#6B6B80" }}>
            Enviamos um link de confirmação para
          </p>
          <p className="text-sm font-bold mb-6" style={{ color: "#BEFF00" }}>{email}</p>
          <p className="text-xs mb-8" style={{ color: "#6B6B80" }}>
            Clique no link do email para ativar sua conta e iniciar o onboarding.
          </p>

          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setEmailSent(false); setPassword(""); }}
              className="btn-secondary w-full"
            >
              Usar outro email
            </motion.button>
            <Link href="/login" className="block text-sm text-center" style={{ color: "#6B6B80" }}>
              Já confirmei — fazer login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#0A0A0F" }}
    >
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#BEFF00" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#BEFF00", boxShadow: "0 0 30px rgba(190,255,0,0.4)" }}
          >
            <Zap className="w-9 h-9 text-black" fill="black" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-wider" style={{ color: "#FAFAFA", letterSpacing: "0.15em" }}>
            BEAST MODE
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B6B80" }}>Crie sua conta e comece agora</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B6B80" }} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="input-field pl-11"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B6B80" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="input-field pl-11"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B6B80" }} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha (min. 6 caracteres)"
              required
              className="input-field pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "#6B6B80" }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Criar Conta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: "#6B6B80" }}>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#BEFF00" }}>
            Fazer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
