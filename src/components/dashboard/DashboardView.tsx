"use client";

import React, { useState } from "react";
import { Droplet, Sparkles, Bed, Plus, Check, Heart, Stethoscope } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import { BentoGrid, BentoCard, NavCard } from "@/components/dashboard/BentoGrid";
import { 
  mockDailyHabits, 
  mockSupplements as initialSupplements, 
  Supplement 
} from "@/lib/mock-data";
import { useProfileStore, getCurrentCycleDay, getCyclePhase } from "@/lib/store/profile";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ setActiveTab }: DashboardViewProps) {
  const profile = useProfileStore((state) => state.profile);

  // Local state for interactiveness
  const [supplements, setSupplements] = useState<Supplement[]>(initialSupplements);
  const [waterIntake, setWaterIntake] = useState(mockDailyHabits.waterIntake);
  const [selectedMood, setSelectedMood] = useState(mockDailyHabits.mood);
  const [journalNote, setJournalNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // Dynamically compute cycle status
  const cycleDay = getCurrentCycleDay(profile.lastPeriodDate, profile.cycleLength);
  const phase = getCyclePhase(cycleDay, profile.cycleLength);
  const daysUntilNextPeriod = profile.lastPeriodDate
    ? Math.max(0, profile.cycleLength - cycleDay)
    : 16;

  const toggleSupplement = (id: string) => {
    setSupplements(prev =>
      prev.map(sup => (sup.id === id ? { ...sup, taken: !sup.taken } : sup))
    );
  };

  const addWater = () => {
    setWaterIntake(prev => Math.min(prev + 250, mockDailyHabits.waterTarget));
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalNote.trim()) return;
    setNoteSaved(true);
    setTimeout(() => {
      setNoteSaved(false);
      setJournalNote("");
    }, 2000);
  };

  const waterProgress = (waterIntake / mockDailyHabits.waterTarget) * 100;
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
          Your body is in the <span className="font-semibold text-plum">{phase.name}</span> (Day {cycleDay} of {profile.cycleLength}). Estrogen is rising, supporting focus and creative projects.
        </p>
      </section>

      {/* Restructured Bento Grid Layout */}
      <BentoGrid>
        
        {/* Card 1: Cycle Progress Tracker (Span 2) */}
        <BentoCard 
          span={2} 
          className="flex flex-col md:flex-row items-center gap-8 justify-between min-h-[220px]"
        >
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
                {waterIntake}ml / {mockDailyHabits.waterTarget}ml
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
                disabled={waterIntake >= mockDailyHabits.waterTarget}
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
                {mockDailyHabits.sleepHours}h / {mockDailyHabits.sleepTarget}h
              </span>
            </div>
            <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400/70 rounded-full" 
                style={{ width: `${(mockDailyHabits.sleepHours / mockDailyHabits.sleepTarget) * 100}%` }}
              />
            </div>
          </div>

          {/* Mood Buttons */}
          <div className="space-y-1.5 pt-1.5 border-t border-border/20">
            <span className="text-[11px] font-medium text-ink-soft">Daily Mood</span>
            <div className="flex gap-1 justify-between">
              {(["serene", "energetic", "sensitive", "fatigued", "reflective"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`flex-1 py-1 rounded-md text-[9px] font-semibold transition-all capitalize cursor-pointer border ${
                    selectedMood === m
                      ? "bg-sakura-deep/15 text-sakura-deep border-sakura-deep/30 shadow-inner"
                      : "bg-surface-glass/40 border-transparent text-ink-soft hover:bg-surface-glass/85"
                  }`}
                >
                  {m}
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
              disabled={!journalNote.trim()}
            >
              {noteSaved ? "Note Logged ✓" : "Save Daily Note"}
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
