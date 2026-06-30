"use client";

import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarHeart, ShieldAlert } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile";
import {
  calculateCycle,
  refineCycleMetrics,
} from "@/lib/cycle";
import DayDetailSheet from "./DayDetailSheet";
import PhaseInsightCard from "./PhaseInsightCard";
import TrendsView from "@/components/trends/TrendsView";
import GlassCard from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "@/lib/motion";
import { format, isSameDay, parseISO } from "date-fns";

// Base stylesheet for react-day-picker (required for grid layout; we layer on top)
import "react-day-picker/style.css";

export default function CalendarView() {
  const profile = useProfileStore((state) => state.profile);
  const cycleLogs = useProfileStore((state) => state.cycleLogs);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);

  // Refine cycle metrics from log history
  const { cycleLength: refinedCycleLength, periodLength: refinedPeriodLength } = refineCycleMetrics(
    Object.values(cycleLogs),
    profile.cycleLength,
    5
  );

  const currentCalc = calculateCycle(
    profile.lastPeriodDate,
    refinedCycleLength,
    refinedPeriodLength,
    new Date()
  );

  const daysUntilNextPeriod = currentCalc.daysUntilNextPeriod;
  const cycleDay = currentCalc.cycleDay;
  const currentPhase = currentCalc.phase;

  // Build modifier date sets for DayPicker (no custom Day component — preserves the table/grid)
  const loggedPeriodDays: Date[] = Object.values(cycleLogs)
    .filter((l) => l.isPeriod)
    .map((l) => parseISO(l.date));

  const predictedPeriodDays: Date[] = currentCalc.periodWindow.filter(
    (d) => !loggedPeriodDays.some((lp) => isSameDay(lp, d))
  );

  const fertileDays: Date[] = currentCalc.fertileWindow.filter(
    (d) => !isSameDay(d, currentCalc.ovulationDate)
  );

  const ovulationDays: Date[] = [currentCalc.ovulationDate];

  // Days that have symptom/note dots (for CSS class)
  const loggedDotDays: Date[] = Object.values(cycleLogs)
    .filter((l) => l.symptoms.length > 0 || !!l.note)
    .map((l) => parseISO(l.date));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto"
    >
      {/* Header Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sakura-deep/15 border border-sakura-deep/20 flex items-center justify-center text-sakura-deep flex-shrink-0">
            <CalendarHeart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-ink-soft uppercase font-semibold">Current Phase</p>
            <p className="text-sm font-bold text-ink-text font-serif leading-snug">{currentPhase.name}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-plum/15 border border-plum/20 flex items-center justify-center text-plum flex-shrink-0">
            <span className="text-sm font-bold">{cycleDay}</span>
          </div>
          <div>
            <p className="text-[10px] text-ink-soft uppercase font-semibold">Cycle Progress</p>
            <p className="text-sm font-bold text-ink-text font-serif leading-snug">Day {cycleDay} of {refinedCycleLength}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sakura-deep/15 border border-sakura-deep/20 flex items-center justify-center text-sakura-deep flex-shrink-0">
            <span className="text-sm font-bold">{daysUntilNextPeriod}</span>
          </div>
          <div>
            <p className="text-[10px] text-ink-soft uppercase font-semibold">Next Period</p>
            <p className="text-sm font-bold text-ink-text font-serif leading-snug">in {daysUntilNextPeriod} Days</p>
          </div>
        </GlassCard>

      </section>

      {/* Main Grid — Calendar + Phase Insight (stacked on mobile, side-by-side on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Calendar Panel */}
        <GlassCard className="p-5 flex flex-col items-stretch relative overflow-visible">

          {/* DayPicker — NO custom Day/Week/MonthGrid components; use modifiers only */}
          <div className="sakhi-calendar w-full">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setIsLogSheetOpen(true);
                }
              }}
              modifiers={{
                loggedPeriod: loggedPeriodDays,
                predictedPeriod: predictedPeriodDays,
                fertile: fertileDays,
                ovulation: ovulationDays,
                hasDot: loggedDotDays,
              }}
              modifiersClassNames={{
                loggedPeriod: "rdp-day--logged-period",
                predictedPeriod: "rdp-day--predicted-period",
                fertile: "rdp-day--fertile",
                ovulation: "rdp-day--ovulation",
                hasDot: "rdp-day--has-dot",
              }}
              className="w-full m-0"
            />
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border/30 w-full space-y-2.5 text-[9px] font-semibold text-ink-soft">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#d56f96]/35 border border-[#d56f96]/40 shadow-inner flex-shrink-0" />
                <span>Logged Period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-dashed border-[#d56f96]/50 bg-[#d56f96]/10 flex-shrink-0" />
                <span>Predicted Period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#8a5a78]/15 border border-[#8a5a78]/20 flex-shrink-0" />
                <span>High Fertility</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#8a5a78]/30 border border-[#8a5a78]/50 flex-shrink-0" />
                <span>Est. Ovulation</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-border/10 justify-center">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8a5a78]" />
                <span>Symptoms / Notes Logged</span>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="mt-4 bg-plum/5 border border-plum/15 rounded-xl p-3 flex items-start gap-2 w-full text-[10px] text-ink-soft leading-normal">
            <ShieldAlert className="h-4 w-4 text-plum flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-bold text-plum">Disclaimer:</span> Predictions are ESTIMATES based on your logged history; not a contraceptive or medical diagnosis tool.
            </p>
          </div>

        </GlassCard>

        {/* Phase Insight Card */}
        <PhaseInsightCard phaseId={currentPhase.id} />

      </div>

      {/* Sheet Log Drawer */}
      <AnimatePresence>
        {isLogSheetOpen && (
          <DayDetailSheet
            key={format(selectedDate, "yyyy-MM-dd")}
            date={selectedDate}
            onClose={() => setIsLogSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Wellness Trends */}
      <div className="pt-4 border-t border-border/20">
        <TrendsView />
      </div>

    </motion.div>
  );
}
