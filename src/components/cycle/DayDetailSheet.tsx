"use client";

import React, { useState } from "react";
import { X, Droplet, Sparkles, Smile, Flame, BookOpen, Trash2 } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile";
import { CycleLog } from "@/lib/cycle";
import GlassButton from "@/components/ui/GlassButton";
import { format } from "date-fns";

interface DayDetailSheetProps {
  date: Date;
  onClose: () => void;
}

const SYMPTOM_LIBRARY = [
  "Cramps",
  "Bloating",
  "Headache",
  "Fatigue",
  "Acne",
  "Backache",
  "Mood Swings",
  "Nausea",
  "Breast Tenderness",
  "Insomnia",
];

const MOODS = [
  { id: "serene", label: "Serene 🌸" },
  { id: "energetic", label: "Energetic ⚡" },
  { id: "sensitive", label: "Sensitive 🥺" },
  { id: "fatigued", label: "Fatigued 😴" },
  { id: "reflective", label: "Reflective 🧘" },
  { id: "anxious", label: "Anxious 😰" },
  { id: "down", label: "Down 😔" },
  { id: "happy", label: "Happy 😊" },
  { id: "stressed", label: "Stressed 😫" },
  { id: "irritable", label: "Irritable 😠" },
];

export default function DayDetailSheet({ date, onClose }: DayDetailSheetProps) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { cycleLogs, setCycleLog, deleteCycleLog } = useProfileStore();

  const existingLog = cycleLogs[dateStr];

  // Local state initialized directly from existing log (avoids useEffect cascading renders)
  const [isPeriod, setIsPeriod] = useState(() => existingLog?.isPeriod ?? false);
  const [flow, setFlow] = useState<"spotting" | "light" | "medium" | "heavy" | undefined>(
    () => existingLog?.flow
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    () => existingLog?.symptoms || []
  );
  const [mood, setMood] = useState<string | undefined>(() => existingLog?.mood);
  const [energy, setEnergy] = useState<number>(() => existingLog?.energy ?? 3);
  const [note, setNote] = useState(() => existingLog?.note || "");

  const handleSave = () => {
    const logData: Partial<CycleLog> = {
      isPeriod,
      symptoms: selectedSymptoms,
      mood,
      energy,
      note: note.trim() ? note : undefined,
      ...(isPeriod ? { flow: flow || "medium" } : { flow: undefined }),
    };

    setCycleLog(dateStr, logData);
    onClose();
  };

  const handleDelete = () => {
    deleteCycleLog(dateStr);
    onClose();
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-xs transition-opacity duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md h-full bg-gradient-to-b from-surface-white/60 via-surface-white/45 to-surface-white/55 backdrop-blur-xl border-l border-border/80 p-6 shadow-glass flex flex-col justify-between overflow-y-auto z-10 animate-slide-in-right">
        
        {/* Header */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-bold text-ink-text">
              Log Details
            </h2>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-border/20 text-ink-soft cursor-pointer"
              aria-label="Close sheet"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          <p className="text-xs text-sakura-deep font-semibold">
            {format(date, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Content Form Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 my-2">
          
          {/* Period Toggle */}
          <div className="bg-surface-glass/40 border border-border/40 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-text flex items-center gap-1.5">
                <Droplet className="h-4 w-4 text-sakura-deep" />
                Active Period Day?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsPeriod(!isPeriod);
                  if (!flow) setFlow("medium");
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer select-none transition-all ${
                  isPeriod
                    ? "bg-sakura-deep text-white border-transparent"
                    : "bg-surface-glass/50 text-ink-soft border-border hover:bg-surface-white/50"
                }`}
              >
                {isPeriod ? "Logged Period" : "No Period"}
              </button>
            </div>

            {/* Period Flow Selector */}
            {isPeriod && (
              <div className="space-y-1.5 pt-2 border-t border-border/20 animate-fade-in">
                <span className="text-[10px] font-medium text-ink-soft">Flow Intensity</span>
                <div className="flex gap-1.5 justify-between">
                  {(["spotting", "light", "medium", "heavy"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFlow(f)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-semibold border capitalize cursor-pointer transition-all ${
                        flow === f
                          ? "bg-sakura-deep/15 text-sakura-deep border-sakura-deep/30 shadow-inner"
                          : "bg-surface-glass/50 border-transparent text-ink-soft hover:bg-surface-glass/85"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Symptoms Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-text flex items-center gap-1.5 pl-1">
              <Sparkles className="h-4 w-4 text-plum" />
              Symptom Checklist
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SYMPTOM_LIBRARY.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`py-2 px-3 rounded-xl border text-left text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-plum/15 text-plum border-plum/30 shadow-inner"
                        : "bg-surface-glass/40 border-border/50 hover:bg-surface-white/40 text-ink-soft"
                    }`}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-text flex items-center gap-1.5 pl-1">
              <Smile className="h-4 w-4 text-sakura-deep" />
              Daily Mood State
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => {
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(mood === m.id ? undefined : m.id)}
                    className={`py-1.5 px-3 rounded-full border text-[10px] font-semibold transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? "bg-sakura-deep/15 text-sakura-deep border-sakura-deep/30 shadow-inner"
                        : "bg-surface-glass/40 border-border/50 hover:bg-surface-white/40 text-ink-soft"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Slider */}
          <div className="bg-surface-glass/40 border border-border/40 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ink-text">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" />
                Stamina &amp; Energy
              </span>
              <span className="text-sakura-deep">{energy} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-1.5 bg-border/40 rounded-lg appearance-none cursor-pointer accent-sakura-deep focus:outline-none"
            />
            <div className="flex justify-between text-[8px] text-ink-soft font-semibold px-0.5">
              <span>Fatigued</span>
              <span>Balanced</span>
              <span>Peak Energy</span>
            </div>
          </div>

          {/* Notes Box */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-ink-text flex items-center gap-1.5 pl-1">
              <BookOpen className="h-4 w-4 text-ink-soft" />
              Notes &amp; Observations
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record cervical mucus signs, body temperatures, or cramping times..."
              className="w-full h-24 p-3 rounded-2xl border border-border bg-surface-glass/40 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 resize-none shadow-inner"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 border-t border-border/20 pt-4 flex-shrink-0">
          {existingLog && (
            <GlassButton
              variant="ghost"
              onClick={handleDelete}
              className="p-3 text-red-500 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/30 flex items-center justify-center rounded-xl"
              aria-label="Delete log"
            >
              <Trash2 className="h-4 w-4" />
            </GlassButton>
          )}
          <GlassButton variant="secondary" onClick={onClose} className="flex-1 py-3 text-xs">
            Cancel
          </GlassButton>
          <GlassButton variant="primary" onClick={handleSave} className="flex-1 py-3 text-xs">
            Save Entry
          </GlassButton>
        </div>

      </div>
    </div>
  );
}
