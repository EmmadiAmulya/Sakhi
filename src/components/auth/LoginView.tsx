"use client";

import React, { useState } from "react";
import { Mail, Sparkles, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import { motion } from "framer-motion";

export default function LoginView() {
  const login = useProfileStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    // Simulate sending magic link
    setTimeout(() => {
      setLoading(false);
      setMagicLinkSent(true);
      
      // Simulate user clicking magic link after 1.5s
      setTimeout(() => {
        login(email);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        <GlassCard className="p-8 space-y-6 rounded-3xl border border-border bg-gradient-to-tr from-surface-white/40 via-surface-white/20 to-surface-white/50 backdrop-blur-xl saturate-[140%] shadow-glass shadow-glass-inset">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sakura-deep/15 border border-sakura-deep/25">
              <Heart className="h-6 w-6 text-sakura-deep fill-sakura-deep/30" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-wider text-ink-text mt-4">
              さき <span className="text-sakura-deep">Sakhi</span>
            </h1>
            <p className="text-xs text-ink-soft">
              Women&apos;s Health Companion &amp; Empathetic Guide
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!magicLinkSent ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label htmlFor="email" className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider pl-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-soft" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="name@example.com"
                      disabled={loading}
                      className="w-full bg-surface-glass/40 border border-border rounded-xl pl-10 pr-4 py-3 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner backdrop-blur-md"
                    />
                  </div>
                  {error && (
                    <p className="text-[10px] text-red-500 font-semibold pl-1 pt-1">{error}</p>
                  )}
                </div>

                <GlassButton
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-semibold"
                >
                  {loading ? "Sending Magic Link..." : "Continue with Email"}
                </GlassButton>

                <div className="text-center pt-2">
                  <p className="text-[10px] text-ink-soft/80 leading-normal px-2">
                    Sakhi is designed with local state privacy. 
                    Your account data and chat logs never leave your workspace browser.
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="sent-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 py-4"
              >
                <div className="mx-auto h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ink-text">Magic Link Sent!</h3>
                  <p className="text-xs text-ink-soft leading-relaxed px-4">
                    We&apos;ve sent a login link to <span className="font-semibold text-plum">{email}</span>. Click it to verify your access.
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-sakura-deep font-semibold animate-pulse">
                  Simulating authentication verification...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </GlassCard>
      </motion.div>
    </div>
  );
}

import { AnimatePresence } from "framer-motion";
