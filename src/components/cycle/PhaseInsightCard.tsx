"use client";

import React from "react";
import { Sparkles, Brain, Flame, Apple, Dumbbell, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { PHASE_CONTENT } from "@/lib/phase-content";

interface PhaseInsightCardProps {
  phaseId: "menstrual" | "follicular" | "ovulatory" | "luteal";
}

export default function PhaseInsightCard({ phaseId }: PhaseInsightCardProps) {
  const content = PHASE_CONTENT[phaseId];

  // Map icons to the sections
  return (
    <GlassCard className="p-6 space-y-4 rounded-3xl border border-border/80 bg-gradient-to-tr from-surface-white/40 via-surface-white/20 to-surface-white/50 backdrop-blur-xl shadow-glass">
      
      {/* Title */}
      <div className="border-b border-border/30 pb-3">
        <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block mb-0.5">
          Phase Insight
        </span>
        <h3 className="font-serif text-lg font-bold text-ink-text leading-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sakura-deep fill-sakura-deep/10" />
          {content.title}
        </h3>
      </div>

      {/* Content list grid */}
      <div className="space-y-3.5 text-xs">
        
        {/* Focus */}
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 flex-shrink-0">
            <Brain className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-ink-text block">Focus &amp; Mental Energy</span>
            <p className="text-[11px] text-ink-soft leading-normal">{content.focus}</p>
          </div>
        </div>

        {/* Energy */}
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
            <Flame className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-ink-text block">Physical Stamina</span>
            <p className="text-[11px] text-ink-soft leading-normal">{content.energy}</p>
          </div>
        </div>

        {/* Nutrition */}
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
            <Apple className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-ink-text block">Nutritive Alignment</span>
            <p className="text-[11px] text-ink-soft leading-normal">{content.nutrition}</p>
          </div>
        </div>

        {/* Exercise */}
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 flex-shrink-0">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-ink-text block">Movement Recommendations</span>
            <p className="text-[11px] text-ink-soft leading-normal">{content.exercise}</p>
          </div>
        </div>

        {/* Self Care */}
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0">
            <Heart className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-ink-text block">Rest &amp; Nourishment</span>
            <p className="text-[11px] text-ink-soft leading-normal">{content.selfCare}</p>
          </div>
        </div>

      </div>

      <div className="text-[9px] text-ink-soft/70 border-t border-border/10 pt-2.5 text-center leading-normal">
        *General educational wellness suggestions. Consult a medical professional for personal clinical advice.
      </div>

    </GlassCard>
  );
}
