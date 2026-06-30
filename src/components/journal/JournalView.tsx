"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Sparkles, Trash2, CalendarHeart, Plus, ArrowLeft } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile";
import type { JSONContent } from "@tiptap/react";
import { calculateCycle, refineCycleMetrics } from "@/lib/cycle";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants } from "@/lib/motion";
import { format, parseISO } from "date-fns";

// Lazy-load the TipTap Editor component to optimize Next.js First Load JS bundle size
const DynamicEditor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-xs text-ink-soft animate-pulse bg-surface-glass/30 border border-border/80 rounded-2xl">
      Loading Rich Text Editor...
    </div>
  ),
});

const WRITING_PROMPTS = [
  "How is your physical energy showing up in your body today?",
  "What thoughts or emotions are taking up the most space right now?",
  "Reflect on a gentle boundary you set (or wish to set) today.",
  "What is one thing you can do to treat your body with kindness today?",
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

export default function JournalView() {
  const profile = useProfileStore((state) => state.profile);
  const cycleLogs = useProfileStore((state) => state.cycleLogs);
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useProfileStore();

  const [activeEntryId, setActiveEntryId] = useState<string | "new" | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const [promptIndex, setPromptIndex] = useState(0);

  // Compute current cycle phase to auto-stamp entries
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
  const currentPhaseName = currentCalc.phase.name;

  const handleCreateNew = () => {
    setActiveEntryId("new");
    setSelectedMood(undefined);
  };

  const handleSaveNew = (contentJSON: JSONContent, contentText: string) => {
    // Commit new entry to Zustand store
    addJournalEntry({
      contentJSON,
      contentText,
      mood: selectedMood,
      cyclePhase: currentPhaseName,
    });
    
    // Find the newly created entry's ID to transition to edit mode seamlessly
    // Our Zustand actions append new entries to the front, so the most recent is journalEntries[0] (or will be updated on state re-render)
    setActiveEntryId(null);
  };

  const handleUpdate = (id: string, contentJSON: JSONContent, contentText: string) => {
    updateJournalEntry(id, contentJSON, contentText, selectedMood);
  };

  const activeEntry = journalEntries.find((e) => e.id === activeEntryId);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]"
    >
      <AnimatePresence mode="wait">
        
        {/* Editor Screen (Create or Edit mode) */}
        {activeEntryId ? (
          <motion.div
            key="editor-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5 flex-1 flex flex-col min-h-0"
          >
            {/* Header / Back Bar */}
            <div className="flex justify-between items-center bg-surface-glass/40 border border-border/50 p-3.5 rounded-2xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <GlassButton
                  variant="ghost"
                  onClick={() => setActiveEntryId(null)}
                  className="p-2 rounded-full cursor-pointer h-9 w-9 flex items-center justify-center"
                  aria-label="Back to journal list"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </GlassButton>
                <div>
                  <h3 className="text-xs font-bold text-ink-text font-serif">
                    {activeEntryId === "new" ? "New Reflection" : "Edit Reflection"}
                  </h3>
                  <p className="text-[10px] text-ink-soft">
                    Stamped: <span className="font-semibold text-sakura-deep">{currentPhaseName}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full select-none">
                Autosaving...
              </span>
            </div>

            {/* Mood Stamp selector */}
            <GlassCard className="p-4 space-y-2.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-ink-text uppercase tracking-wider block pl-1">
                Stamp today&apos;s mood
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => {
                  const isSelected = selectedMood === m.id || (activeEntry && activeEntry.mood === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMood(m.id);
                        if (activeEntry) {
                          updateJournalEntry(activeEntry.id, activeEntry.contentJSON, activeEntry.contentText, m.id);
                        }
                      }}
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
            </GlassCard>

            {/* Prompt nudge card (only for new entries) */}
            {activeEntryId === "new" && (
              <GlassCard className="p-4 space-y-2 flex-shrink-0 bg-sakura/5 border-sakura-deep/10">
                <span className="text-[10px] font-bold text-sakura-deep flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gentle Writing Prompt
                </span>
                <p className="text-xs text-ink-text leading-relaxed font-serif italic">
                  &ldquo;{WRITING_PROMPTS[promptIndex]}&rdquo;
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setPromptIndex((prev) => (prev + 1) % WRITING_PROMPTS.length)}
                    className="text-[9px] font-bold text-plum hover:text-sakura-deep transition-all cursor-pointer"
                  >
                    Cycle Prompt &rarr;
                  </button>
                </div>
              </GlassCard>
            )}

            {/* Core Editor container */}
            <div className="flex-1 min-h-0 bg-surface-white/20 rounded-2xl">
              <DynamicEditor
                initialContentJSON={activeEntry ? activeEntry.contentJSON : null}
                onSave={(json, text) => {
                  if (activeEntryId === "new") {
                    handleSaveNew(json, text);
                  } else {
                    handleUpdate(activeEntryId, json, text);
                  }
                }}
              />
            </div>
            
            <div className="text-[10px] text-ink-soft/70 text-center flex-shrink-0">
              Your journal entries are encrypted and saved strictly in your local browser state.
            </div>

          </motion.div>
        ) : (
          /* List Timeline Screen */
          <motion.div
            key="list-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4 flex-1 flex flex-col min-h-0"
          >
            {/* Title / Action bar */}
            <div className="flex justify-between items-center bg-surface-glass/40 border border-border/50 p-4 rounded-2xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-sakura-deep/15 border border-sakura-deep/20 flex items-center justify-center text-sakura-deep">
                  <BookOpen className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h1 className="font-serif text-lg font-bold text-ink-text leading-tight">Reflections Diary</h1>
                  <p className="text-[10px] text-ink-soft">Capture your mental energy and cycle patterns in details.</p>
                </div>
              </div>
              <GlassButton variant="primary" onClick={handleCreateNew} className="py-2.5 px-4 text-xs font-semibold gap-1">
                <Plus className="h-3.5 w-3.5" /> Write Reflection
              </GlassButton>
            </div>

            {/* Timeline scroll panel */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <AnimatePresence initial={false}>
                {journalEntries.length === 0 ? (
                  <GlassCard className="p-8 text-center space-y-4 rounded-3xl">
                    <div className="mx-auto h-12 w-12 rounded-full bg-sakura/5 border border-sakura-deep/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-sakura-deep" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                      <h3 className="text-sm font-bold text-ink-text font-serif">Diary is Empty</h3>
                      <p className="text-xs text-ink-soft leading-relaxed">
                        Create your first rich-text reflection card. Stamped dynamically with your cycle day, phase, and mood logs.
                      </p>
                    </div>
                    <GlassButton variant="secondary" onClick={handleCreateNew} className="mx-auto py-2 px-4 text-xs">
                      Start Journaling
                    </GlassButton>
                  </GlassCard>
                ) : (
                  journalEntries.map((entry) => {
                    const moodObj = MOODS.find((m) => m.id === entry.mood);
                    // Split into two safe format() calls — &bull; is NOT a valid date-fns token
                    const formattedDate = `${format(parseISO(entry.createdAt), "MMMM d, yyyy")} · ${format(parseISO(entry.createdAt), "h:mm a")}`;
                    
                    return (
                      <motion.div
                        key={entry.id}
                        variants={itemVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="group relative"
                      >
                        <GlassCard
                          onClick={() => {
                            setActiveEntryId(entry.id);
                            setSelectedMood(entry.mood);
                          }}
                          className="p-5 space-y-2.5 text-left border border-border/80 hover:border-sakura-deep/30 hover:bg-surface-white/60 transition-all duration-300 rounded-2xl cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-semibold text-ink-soft flex items-center gap-1">
                              <CalendarHeart className="h-3.5 w-3.5 text-plum" />
                              <span>{formattedDate}</span>
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {moodObj && (
                                <span className="text-[9px] font-bold text-plum bg-sakura/10 px-2 py-0.5 rounded-full select-none">
                                  {moodObj.label}
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-sakura-deep bg-sakura/10 px-2 py-0.5 rounded-full select-none">
                                {entry.cyclePhase}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-ink-soft leading-relaxed font-serif line-clamp-3">
                            {entry.contentText || "Empty reflection... Click to write notes."}
                          </p>

                          <div className="flex justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteJournalEntry(entry.id);
                              }}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                        </GlassCard>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
