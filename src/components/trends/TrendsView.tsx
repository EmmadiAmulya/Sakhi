"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TrendingUp, BarChart2, Calendar, ClipboardList } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile";
import { refineCycleMetrics } from "@/lib/cycle";
import GlassCard from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

// Dynamic import for Recharts rendering logic to avoid bloating First Load JS
const DynamicCharts = dynamic(() => import("./TrendsCharts"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-xs text-ink-soft animate-pulse bg-surface-glass/30 border border-border/80 rounded-2xl">
      Analyzing Wellness Trends...
    </div>
  ),
});

export default function TrendsView() {
  const profile = useProfileStore((state) => state.profile);
  const cycleLogs = useProfileStore((state) => state.cycleLogs);

  const logsArray = Object.values(cycleLogs);
  const hasEnoughData = logsArray.length >= 3;

  // Compute refined metrics
  const { cycleLength: refinedCycleLength, periodLength: refinedPeriodLength } = refineCycleMetrics(
    logsArray,
    profile.cycleLength,
    5
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto"
    >
      {/* Header banner */}
      <div className="flex items-center gap-3 bg-surface-glass/40 border border-border/50 p-4 rounded-2xl">
        <div className="h-10 w-10 rounded-full bg-plum/15 border border-plum/20 flex items-center justify-center text-plum flex-shrink-0">
          <TrendingUp className="h-5.5 w-5.5" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-ink-text leading-tight">Wellness Insights &amp; Trends</h1>
          <p className="text-[10px] text-ink-soft">Understand your body patterns, mood curves, and symptom frequencies over time.</p>
        </div>
      </div>

      {/* Averages summaries grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        
        <GlassCard className="p-4 flex items-center gap-3 text-left">
          <Calendar className="h-5 w-5 text-sakura-deep flex-shrink-0" />
          <div>
            <span className="text-[9px] text-ink-soft block uppercase font-semibold">Avg Cycle Length</span>
            <span className="font-bold text-ink-text text-sm leading-snug">{refinedCycleLength} Days</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3 text-left">
          <ClipboardList className="h-5 w-5 text-plum flex-shrink-0" />
          <div>
            <span className="text-[9px] text-ink-soft block uppercase font-semibold">Avg Period Duration</span>
            <span className="font-bold text-ink-text text-sm leading-snug">{refinedPeriodLength} Days</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3 text-left col-span-2 sm:col-span-1">
          <BarChart2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <div>
            <span className="text-[9px] text-ink-soft block uppercase font-semibold">Total Days Logged</span>
            <span className="font-bold text-ink-text text-sm leading-snug">{logsArray.length} Entries</span>
          </div>
        </GlassCard>

      </section>

      {/* Charts / Empty state content */}
      {hasEnoughData ? (
        <DynamicCharts logs={logsArray} />
      ) : (
        <GlassCard className="p-8 text-center space-y-4 rounded-3xl">
          <div className="mx-auto h-12 w-12 rounded-full bg-plum/5 border border-border flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-plum" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h3 className="text-sm font-bold text-ink-text font-serif">Insufficient Data</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Log details for at least <span className="font-bold text-sakura-deep">3 days</span> in your cycle calendar to initialize visual mood curves, energy analytics, and symptom frequency frequencies.
            </p>
          </div>
        </GlassCard>
      )}

    </motion.div>
  );
}
