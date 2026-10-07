"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, type Toast } from "@/lib/toast";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const ACCENT = {
  success: "text-emerald-600 border-emerald-500/25 bg-emerald-500/10",
  error: "text-red-600 border-red-500/25 bg-red-500/10",
  info: "text-plum border-plum/25 bg-plum/10",
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto flex items-start gap-2.5 rounded-2xl border border-border bg-surface-white/80 px-4 py-3 shadow-glass backdrop-blur-xl saturate-[140%] max-w-sm"
      role="status"
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${ACCENT[toast.variant]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="flex-1 text-xs leading-relaxed text-ink-text">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="text-ink-soft/70 hover:text-ink-text transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
