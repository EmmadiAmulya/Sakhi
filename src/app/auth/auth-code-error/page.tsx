"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { motion } from "framer-motion";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        <GlassCard className="p-8 text-center space-y-6 rounded-3xl border border-border bg-gradient-to-tr from-surface-white/40 via-surface-white/20 to-surface-white/50 backdrop-blur-xl saturate-[140%] shadow-glass shadow-glass-inset">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sakura-deep/15 border border-sakura-deep/25">
            <AlertCircle className="h-6 w-6 text-sakura-deep" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-xl font-bold text-ink-text">Link Expired or Invalid</h1>
            <p className="text-xs text-ink-soft leading-relaxed px-2">
              The sign-in link is invalid, expired, or has already been used. Please request a new verification link.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/" passHref>
              <GlassButton variant="primary" className="w-full py-3 text-xs font-semibold">
                Back to Sign In
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
