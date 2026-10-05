"use client";

import React, { useState } from "react";
import { Droplet, Sparkles, Bed, Plus, Minus, Check, Heart, Stethoscope } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import { BentoGrid, BentoCard, NavCard } from "@/components/dashboard/BentoGrid";
import { useProfileStore, getCurrentCycleDay, getCyclePhase } from "@/lib/store/profile";
import { useSupplementsToday, useToggleSupplement } from "@/lib/data/supplements";
import { useTodayMoodLog, useUpsertMoodLog } from "@/lib/data/mood-logs";
import { useHabitValue, useSetHabitValue } from "@/lib/data/habits";
import { useAddJournalEntry } from "@/lib/data/journal";
import { useDevSeed } from "@/lib/data/dev-seed";
import { MOODS } from "@/lib/moods";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ setActiveTab }: DashboardViewProps) {
  const profile = useProfileStore((state) => state.profile);

  // Dev-only mock seed (no-op unless NEXT_PUBLIC_ENABLE_DEV_SEED=true)
  useDevSeed();

  // Supplements + mood + water persist to Supabase. Sleep is display-only
  // (no input UI yet) so it stays a constant.
  const { data: supplements = [] } = useSupplementsToday();
  const toggleSupp = useToggleSupplement();
  const { data: todayMood } = useTodayMoodLog();
  const upsertMood = useUpsertMoodLog();
  const addJournalEntry = useAddJournalEntry();

  const SLEEP_TARGET = 8;
  const WATER_TARGET = 2000;

  const { data: waterData } = useHabitValue("Water");
  const waterValue = waterData ?? 0;
  const setWater = useSetHabitValue("Water");

  const { data: sleepData } = useHabitValue("Sleep");
  const sleepValue = sleepData ?? 0;
  const setSleep = useSetHabitValue("Sleep");

  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const activeMood = selectedMood ?? todayMood?.mood ?? undefined;
  const [journalNote, setJournalNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // Dynamically compute cycle status
  const hasCycleData = !!profile.lastPeriodDate;
  const cycleDay = getCurrentCycleDay(profile.lastPeriodDate, profile.cycleLength);
  const phase = getCyclePhase(cycleDay, profile.cycleLength);
  const daysUntilNextPeriod = hasCycleData
    ? Math.max(0, profile.cycleLength - cycleDay)
    : 0;

  const toggleSupplement = (id: string) => {
    const current = supplements.find((s) => s.id === id);
    if (!current) return;
    toggleSupp.mutate({ id, taken: !current.taken });
  };

  const addWater = () => {
    setWater.mutate(Math.min(waterValue + 250, WATER_TARGET));
  };

  const adjustSleep = (delta: number) => {
    const next = Math.round(Math.min(24, Math.max(0, sleepValue + delta)) * 10) / 10;
    setSleep.mutate(next);
  };

  const sleepProgress = Math.min(100, (sleepValue / SLEEP_TARGET) * 100);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    const note = journalNote.trim();
    if (!note || addJournalEntry.isPending) return;

    addJournalEntry.mutate(
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        contentJSON: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: note }],
            },
          ],
        },
        contentText: note,
        mood: activeMood,
        cyclePhase: phase.id,
      },
      {
        onSuccess: () => {
          setNoteSaved(true);
          setJournalNote("");
          setTimeout(() => {
            setNoteSaved(false);
          }, 2500);
        },
      }
    );
  };

  const waterProgress = (waterValue / WATER_TARGET) * 100;
  const takenSupplementsCount = supplements.filter(s => s.taken).length;
  const displayName = profile.name || "Amulya";

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8 w-full"
    >
      {/* Premium Serif Hero Section */}
      <section className="space-y-2.5">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-text tracking-wide">
          こんにちは, <span className="text-sakura-deep">{displayName}</span>
        </h1>
        <p className="text-sm md:text-base text-ink-soft max-w-2xl leading-relaxed">
          {hasCycleData ? (
            <>
              Your body is in the <span className="font-semibold text-plum">{phase.name}</span> (Day {cycleDay} of {profile.cycleLength}). {phase.description}
            </>
          ) : (
            "Add your last period date in Settings to unlock cycle predictions and phase insights."
          )}
        </p>
        {!hasCycleData && (
          <GlassButton variant="secondary" className="text-xs" onClick={() => setActiveTab("settings")}>
            Open Settings
          </GlassButton>
        )}
      </section>

      {/* Restructured Bento Grid Layout */}
      <BentoGrid>
        
        {/* Card 1: Cycle Progress Tracker (Span 2) */}
        <BentoCard 
          span={2} 
          className="flex flex-col md:flex-row items-center gap-8 justify-between min-h-[220px]"
        >
          {!hasCycleData ? (
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <Sparkles className="h-6 w-6 text-sakura-deep" />
              <h2 className="text-lg font-bold text-ink-text font-serif">Unlock Your Cycle Insights</h2>
              <p className="text-xs leading-relaxed text-ink-soft max-w-md">
                Add your last period date in Settings to unlock cycle predictions and phase insights.
              </p>
              <GlassButton variant="primary" onClick={() => setActiveTab("settings")}>
                Go to Settings
              </GlassButton>
            </div>
          ) : (
          <>
          {/* Visual Cycle Progress Ring */}
          <div 
            onClick={() => setActiveTab("cycle")}
            className="relative flex items-center justify-center w-40 h-40 flex-shrink-0 cursor-pointer group/ring hover:scale-[1.02] transition-all duration-300"
            title="Open Cycle Calendar"
          >
            <div className="absolute inset-0 rounded-full bg-sakura/5 blur-md" />
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-border/30 fill-none"
                strokeWidth="5"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-sakura-deep fill-none transition-all duration-1000"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - cycleDay / profile.cycleLength)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-widest">Day</span>
              <span className="text-3xl font-bold text-ink-text my-0.5 group-hover/ring:text-sakura-deep transition-colors">{cycleDay}</span>
              <span className="text-[9px] font-medium text-plum">of {profile.cycleLength}</span>
            </div>
          </div>

          {/* Cycle Info details */}
          <div className="flex-1 space-y-3.5 text-center md:text-left">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sakura/15 text-plum">
                <Sparkles className="h-3 w-3 text-sakura-deep" />
                {phase.name}
              </span>
            </div>
            <h2 className="text-lg font-bold text-ink-text font-serif">
              Next Period in <span className="text-sakura-deep font-sans">{daysUntilNextPeriod} days</span>
            </h2>
            <p className="text-xs leading-relaxed text-ink-soft">
              {phase.description}
            </p>
            
            <div className="pt-1.5 flex flex-wrap justify-center md:justify-start gap-2.5">
              <GlassButton variant="primary" onClick={() => setActiveTab("sakhi")}>
                Talk to Sakhi
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => setActiveTab("maya")}>
                Ask Maya
              </GlassButton>
            </div>
          </div>
          </>
          )}
        </BentoCard>

        {/* Card 2: Daily Habits (Span 1) */}
        <BentoCard span={1} className="space-y-4">
          <h3 className="text-sm font-bold text-ink-text font-serif border-b border-border/30 pb-2">
            Daily Habits
          </h3>
          
          {/* Water log */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-ink-soft">
                <Droplet className="h-3.5 w-3.5 text-sky-400" />
                Water Intake
              </span>
              <span className="text-ink-text font-semibold">
                {waterValue}ml / {WATER_TARGET}ml
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-border/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-400/70 rounded-full transition-all duration-500" 
                  style={{ width: `${waterProgress}%` }}
                />
              </div>
              <GlassButton 
                onClick={addWater}
                disabled={waterValue >= WATER_TARGET}
                className="p-1 h-6 w-6 rounded-full border-sky-400/20 hover:bg-sky-400/10"
                aria-label="Add 250ml water"
              >
                <Plus className="h-3 w-3 text-sky-500" />
              </GlassButton>
            </div>
          </div>

          {/* Sleep Log */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-ink-soft">
                <Bed className="h-3.5 w-3.5 text-purple-400" />
                Sleep Log
              </span>
              <span className="text-ink-text font-semibold">
                {sleepValue}h / {SLEEP_TARGET}h
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <GlassButton
                onClick={() => adjustSleep(-0.5)}
                disabled={sleepValue <= 0}
                className="p-1 h-6 w-6 rounded-full border-purple-400/20 hover:bg-purple-400/10"
                aria-label="Decrease sleep by 0.5h"
              >
                <Minus className="h-3 w-3 text-purple-500" />
              </GlassButton>
              <div className="flex-1 h-1.5 bg-border/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400/70 rounded-full transition-all duration-500"
                  style={{ width: `${sleepProgress}%` }}
                />
              </div>
              <GlassButton
                onClick={() => adjustSleep(0.5)}
                disabled={sleepValue >= 24}
                className="p-1 h-6 w-6 rounded-full border-purple-400/20 hover:bg-purple-400/10"
                aria-label="Increase sleep by 0.5h"
              >
                <Plus className="h-3 w-3 text-purple-500" />
              </GlassButton>
            </div>
          </div>

          {/* Mood Buttons */}
          <div className="space-y-1.5 pt-1.5 border-t border-border/20">
            <span className="text-[11px] font-medium text-ink-soft">Daily Mood</span>
            <div className="flex flex-wrap gap-1">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMood(m.id);
                    upsertMood.mutate({ mood: m.id });
                  }}
                  className={`px-2 py-1 rounded-md text-[9px] font-semibold transition-all cursor-pointer border ${
                    activeMood === m.id
                      ? "bg-sakura-deep/15 text-sakura-deep border-sakura-deep/30 shadow-inner"
                      : "bg-surface-glass/40 border-transparent text-ink-soft hover:bg-surface-glass/85"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Supplement Checklist (Span 1) */}
        <BentoCard span={1} className="space-y-4">
          <div className="flex justify-between items-center border-b border-border/30 pb-2">
            <h3 className="text-sm font-bold text-ink-text font-serif">
              Supplements
            </h3>
            <span className="text-[9px] font-semibold text-plum bg-sakura/10 px-2 py-0.5 rounded-full">
              {takenSupplementsCount} / {supplements.length} taken
            </span>
          </div>

          <div className="space-y-1.5">
            {supplements.map((sup) => (
              <button
                key={sup.id}
                onClick={() => toggleSupplement(sup.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer select-none text-left ${
                  sup.taken
                    ? "bg-sakura/5 border-sakura-deep/10 opacity-70"
                    : "bg-surface-glass/40 border-border/50 hover:bg-surface-white/40"
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${sup.taken ? "line-through text-ink-soft" : "text-ink-text"}`}>
                    {sup.name}
                  </span>
                  <span className="text-[9px] text-ink-soft">
                    {sup.dosage} &bull; {sup.timeOfDay}
                  </span>
                </div>
                
                <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                  sup.taken 
                    ? "bg-sakura-deep border-sakura-deep text-white" 
                    : "border-border bg-white/40"
                }`}>
                  {sup.taken && <Check className="h-3 w-3 stroke-[3px]" />}
                </div>
              </button>
            ))}
          </div>
        </BentoCard>

        {/* Card 4: Daily Journal Notes (Span 1) */}
        <BentoCard span={1} className="space-y-4 flex flex-col">
          <div className="flex justify-between items-center border-b border-border/30 pb-2">
            <h3 className="text-sm font-bold text-ink-text font-serif">
              Daily Journal
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("journal")}
              className="text-[9px] font-bold text-sakura-deep hover:text-plum cursor-pointer"
            >
              Open Diary &rarr;
            </button>
          </div>
          <form onSubmit={handleSaveNote} className="space-y-3 flex-1 flex flex-col justify-between">
            <textarea
              value={journalNote}
              onChange={(e) => { setJournalNote(e.target.value); setNoteSaved(false); }}
              placeholder="Write a brief note of your reflections today..."
              className="w-full flex-1 min-h-[90px] p-3 rounded-xl border border-border bg-surface-glass/40 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 resize-none shadow-inner"
            />
            <GlassButton 
              variant={noteSaved ? "primary" : "secondary"} 
              type="submit" 
              className="py-2.5 text-xs font-semibold w-full transition-all"
              disabled={!journalNote.trim() || addJournalEntry.isPending}
            >
              {addJournalEntry.isPending ? "Saving..." : noteSaved ? "Note Logged ✓" : "Save Daily Note"}
            </GlassButton>
          </form>
        </BentoCard>

        {/* Card 5: Empathetic Companion NavCard (Span 1) */}
        <NavCard
          label="Empathetic Companion"
          onClick={() => setActiveTab("sakhi")}
          icon={<Heart className="h-4.5 w-4.5 text-sakura-deep" />}
          stat="Sakhi Chat"
          description="Talk to Sakhi, your warm empathetic companion, for emotional support, stress, and mood reflections."
        />

        {/* Card 6: Health Guide NavCard (Span 1) */}
        <NavCard
          label="Medical Research Guide"
          onClick={() => setActiveTab("maya")}
          icon={<Stethoscope className="h-4.5 w-4.5 text-plum" />}
          stat="Maya Advisor"
          description="Consult Maya for evidence-based advice, biological/hormonal pathways, safety guidelines, and emergency aids."
        />

      </BentoGrid>
    </motion.div>
  );
}
