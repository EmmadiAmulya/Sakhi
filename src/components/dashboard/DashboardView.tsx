"use client";

import React, { useState } from "react";
import { Droplet, Sparkles, Smile, Bed, Plus, Check } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { 
  mockCycleStatus, 
  mockDailyHabits, 
  mockSupplements as initialSupplements, 
  Supplement 
} from "@/lib/mock-data";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ setActiveTab }: DashboardViewProps) {
  // Local state to show interactiveness
  const [supplements, setSupplements] = useState<Supplement[]>(initialSupplements);
  const [waterIntake, setWaterIntake] = useState(mockDailyHabits.waterIntake);
  const [selectedMood, setSelectedMood] = useState(mockDailyHabits.mood);
  const [energyLevel, setEnergyLevel] = useState(mockDailyHabits.energy);

  const toggleSupplement = (id: string) => {
    setSupplements(prev =>
      prev.map(sup => (sup.id === id ? { ...sup, taken: !sup.taken } : sup))
    );
  };

  const addWater = () => {
    setWaterIntake(prev => Math.min(prev + 250, mockDailyHabits.waterTarget));
  };

  const waterProgress = (waterIntake / mockDailyHabits.waterTarget) * 100;
  
  // Calculate completed supplements count
  const takenSupplementsCount = supplements.filter(s => s.taken).length;

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
          こんにちは, <span className="text-sakura-deep">Amulya</span>
        </h1>
        <p className="text-sm md:text-base text-ink-soft max-w-2xl leading-relaxed">
          Your body is in the <span className="font-semibold text-plum">{mockCycleStatus.currentPhase.name}</span> (Day {mockCycleStatus.currentDay} of 28). Estrogen is rising, supporting focus and creative projects.
        </p>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Left Column: Cycle Tracker (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 justify-between">
            {/* Visual Cycle Progress Indicator */}
            <div className="relative flex items-center justify-center w-48 h-48 flex-shrink-0">
              {/* Outer Glow ring */}
              <div className="absolute inset-0 rounded-full bg-sakura/5 blur-md" />
              
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  className="stroke-border/40 fill-none"
                  strokeWidth="6"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  className="stroke-sakura-deep fill-none transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - mockCycleStatus.currentDay / mockCycleStatus.cycleLength)}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Inner Label */}
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-widest">Cycle Day</span>
                <span className="text-4xl font-bold text-ink-text my-0.5">{mockCycleStatus.currentDay}</span>
                <span className="text-[11px] font-medium text-plum">of {mockCycleStatus.cycleLength} days</span>
              </div>
            </div>

            {/* Cycle Details */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sakura/15 text-plum">
                  <Sparkles className="h-3 w-3 text-sakura-deep" />
                  {mockCycleStatus.currentPhase.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-ink-text font-serif">
                Next Period in <span className="text-sakura-deep font-sans">{mockCycleStatus.daysUntilNextPeriod} days</span>
              </h2>
              <p className="text-xs leading-relaxed text-ink-soft">
                {mockCycleStatus.currentPhase.description}
              </p>
              
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2.5">
                <GlassButton variant="primary" onClick={() => setActiveTab("companion")}>
                  Talk to Companion
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => setActiveTab("guide")}>
                  View Research
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Quick AI Companion promo box */}
          <GlassCard className="p-6 bg-gradient-to-r from-sakura/5 to-plum/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-sakura/15 flex items-center justify-center flex-shrink-0">
                <Smile className="h-5 w-5 text-sakura-deep" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-semibold text-ink-text font-serif">Empathetic Companion Tip</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {"\"Amulya, today's cycle phase is excellent for group brainstorms or organizing tasks. Keep a water bottle nearby as you work.\""}
                </p>
                <button 
                  onClick={() => setActiveTab("companion")}
                  className="text-xs font-semibold text-sakura-deep hover:text-plum transition-colors pt-1 flex items-center gap-1"
                >
                  {"Ask companion something \u2192"}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Mood, Habits & Supplements */}
        <div className="space-y-6">
          {/* Daily Habit Trackers */}
          <GlassCard className="p-6 space-y-5">
            <h3 className="text-base font-bold text-ink-text font-serif border-b border-border/30 pb-2">
              Daily Habits
            </h3>
            
            {/* Water Tracker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1 text-ink-soft">
                  <Droplet className="h-4 w-4 text-sky-400" />
                  Water Intake
                </span>
                <span className="text-ink-text font-semibold">
                  {waterIntake}ml / {mockDailyHabits.waterTarget}ml
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-400/70 rounded-full transition-all duration-500" 
                    style={{ width: `${waterProgress}%` }}
                  />
                </div>
                <GlassButton 
                  onClick={addWater}
                  disabled={waterIntake >= mockDailyHabits.waterTarget}
                  className="p-1.5 h-8 w-8 rounded-full border-sky-400/20 hover:bg-sky-400/10"
                  aria-label="Add 250ml water"
                >
                  <Plus className="h-4 w-4 text-sky-500" />
                </GlassButton>
              </div>
            </div>

            {/* Sleep Log (Read-only static for demo) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1 text-ink-soft">
                  <Bed className="h-4 w-4 text-purple-400" />
                  Sleep Log
                </span>
                <span className="text-ink-text font-semibold">
                  {mockDailyHabits.sleepHours} hrs / {mockDailyHabits.sleepTarget} hrs
                </span>
              </div>
              <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-400/70 rounded-full" 
                  style={{ width: `${(mockDailyHabits.sleepHours / mockDailyHabits.sleepTarget) * 100}%` }}
                />
              </div>
            </div>

            {/* Mood selector demo */}
            <div className="space-y-2.5 pt-1 border-t border-border/20">
              <span className="text-xs font-medium text-ink-soft">Log Daily Mood</span>
              <div className="flex gap-1.5 justify-between">
                {(["serene", "energetic", "sensitive", "fatigued", "reflective"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood(m)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all capitalize cursor-pointer border ${
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

            {/* Energy Level Selector */}
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-medium text-ink-soft flex justify-between">
                <span>Log Energy Level</span>
                <span className="font-semibold text-plum">{energyLevel} / 5</span>
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setEnergyLevel(lvl)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                      energyLevel === lvl
                        ? "bg-plum/15 text-plum border-plum/30 shadow-inner"
                        : "bg-surface-glass/40 border-transparent text-ink-soft hover:bg-surface-glass/85"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Supplements List */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/30 pb-2">
              <h3 className="text-base font-bold text-ink-text font-serif">
                Supplements
              </h3>
              <span className="text-[10px] font-semibold text-plum bg-sakura/10 px-2 py-0.5 rounded-full">
                {takenSupplementsCount} of {supplements.length} taken
              </span>
            </div>

            <div className="space-y-2">
              {supplements.map((sup) => (
                <div
                  key={sup.id}
                  onClick={() => toggleSupplement(sup.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                    sup.taken
                      ? "bg-sakura/10 border-sakura-deep/20 opacity-80"
                      : "bg-surface-glass/50 border-border/60 hover:bg-surface-glass/90"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold ${sup.taken ? "line-through text-ink-soft" : "text-ink-text"}`}>
                      {sup.name}
                    </span>
                    <span className="text-[10px] text-ink-soft">
                      {sup.dosage} &bull; {sup.timeOfDay}
                    </span>
                  </div>
                  
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                    sup.taken 
                      ? "bg-sakura-deep border-sakura-deep text-white" 
                      : "border-border bg-white/50"
                  }`}>
                    {sup.taken && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

      </div>
    </motion.div>
  );
}
