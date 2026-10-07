"use client";

import React from "react";
import { Send, User, Heart, Stethoscope, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { PERSONAS, type Persona } from "@/lib/personas";
import { usePersonaChat } from "./usePersonaChat";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants } from "@/lib/motion";

const AVATAR_ICONS = { Heart, Stethoscope } as const;

const HANDOFF_LABELS: Record<Persona["id"], string> = {
  sakhi: "🌸 Ask Sakhi",
  maya: "🩺 Ask Maya",
};

interface PersonaChatProps {
  personaId: Persona["id"];
  setActiveTab: (tab: string) => void;
}

/** Shared chat surface for Sakhi and Maya; differences come from PERSONAS config. */
export default function PersonaChat({ personaId, setActiveTab }: PersonaChatProps) {
  const { persona, view, isTyping, inputVal, setInputVal, handleSend, scrollRef } =
    usePersonaChat(personaId);
  const AvatarIcon = AVATAR_ICONS[persona.avatarIcon];
  const other = PERSONAS[personaId === "sakhi" ? "maya" : "sakhi"];

  // Show the typing dots only until the bot starts streaming (thinking counts as output).
  const lastMessage = view[view.length - 1];
  const awaitingFirstToken =
    isTyping && (!lastMessage || lastMessage.sender === "user" || (!lastMessage.text && !lastMessage.thinking));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]"
    >
      {/* Title / Persona Banner */}
      <section className="flex justify-between items-center bg-surface-glass/40 border border-border/50 p-4 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full border flex items-center justify-center ${persona.bgAccentClass} ${persona.borderColorClass} ${persona.textAccentClass}`}
          >
            <AvatarIcon className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-ink-text leading-tight">{persona.name}</h1>
            <p className="text-[10px] text-ink-soft">{persona.tagline}</p>
          </div>
        </div>

        {/* Persistent Handoff Chip */}
        <button
          onClick={() => setActiveTab(other.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all select-none cursor-pointer ${other.bgAccentClass} ${other.textAccentClass} ${other.borderColorClass} ${other.bgAccentHoverClass}`}
        >
          <span>{HANDOFF_LABELS[other.id]}</span>
        </button>
      </section>

      {/* Messages Panel */}
      <GlassCard className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col min-h-0 relative rounded-3xl">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <AnimatePresence initial={false}>
            {view.map((msg) => {
              const isUser = msg.sender === "user";

              if (msg.isEmergency) {
                return (
                  <motion.div
                    key={msg.id}
                    variants={itemVariants}
                    className="flex justify-start w-full pl-11"
                  >
                    <div className="bg-red-500/5 border border-red-500/25 rounded-2xl p-4 max-w-[85%] text-xs space-y-3">
                      <div className="flex items-center gap-1.5 text-red-600 font-bold">
                        <AlertTriangle className="h-4.5 w-4.5" />
                        <span>Critical Helplines &amp; Emergency response</span>
                      </div>
                      <div className="space-y-3 text-[11px] text-ink-text leading-relaxed">
                        {persona.helplines ? (
                          Object.entries(persona.helplines).map(([region, lines]) => (
                            <div key={region}>
                              <p className="font-semibold text-plum uppercase text-[9px] tracking-wider border-b border-border/20 pb-0.5 mb-1">
                                {region}
                              </p>
                              <ul className="space-y-1 pl-1">
                                {lines.map((line) => (
                                  <li key={`${region}-${line.number}`}>
                                    &bull; <span className="font-bold">{line.name}:</span>{" "}
                                    {line.description} —{" "}
                                    <span className="font-bold text-red-600">{line.number}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        ) : (
                          <p>
                            If you are in immediate danger, contact your local emergency services
                            right now. You are not alone.
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        isUser
                          ? "bg-sakura-deep/10 border-sakura-deep/30 text-sakura-deep"
                          : `${persona.bgAccentClass} ${persona.borderColorClass} ${persona.textAccentClass}`
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <AvatarIcon className="h-4 w-4" />}
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm flex flex-col ${
                        isUser
                          ? "bg-sakura-deep/15 text-ink-text border border-sakura-deep/20 rounded-tr-none"
                          : "bg-surface-white/95 text-ink-text border border-border/80 rounded-tl-none"
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>

                      {/* Live reasoning stream (K3) — shown until the answer starts */}
                      {!isUser && msg.thinking && !msg.text && (
                        <div
                          aria-live="polite"
                          className="mb-2 max-h-40 overflow-hidden rounded-xl border border-border/60 bg-surface-glass/40 px-3 py-2 [mask-image:linear-gradient(to_bottom,black_65%,transparent)]"
                        >
                          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-plum">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            Thinking…
                          </p>
                          <p className="mt-1 whitespace-pre-line text-[11px] italic leading-relaxed text-ink-soft">
                            {msg.thinking}
                          </p>
                        </div>
                      )}

                      {/* Safety Disclaimer on bot messages */}
                      {!isUser && persona.disclaimer && (
                        <div className="mt-3 pt-2 border-t border-border/30 flex items-start gap-1 text-[9px] font-medium text-ink-soft/90 italic leading-snug">
                          <ShieldCheck className="h-3 w-3 text-plum flex-shrink-0 mt-0.5" />
                          <span>{persona.disclaimer}</span>
                        </div>
                      )}

                      {msg.timestamp && (
                        <span className="block text-[8px] text-ink-soft/70 text-right mt-1.5">
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {awaitingFirstToken && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start w-full animate-pulse"
              >
                <div className="flex gap-3 items-center pl-1">
                  <div
                    className={`h-8 w-8 rounded-full border flex items-center justify-center ${persona.bgAccentClass} ${persona.borderColorClass} ${persona.textAccentClass}`}
                  >
                    <AvatarIcon className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="bg-surface-white/80 border border-border/85 px-4 py-2 rounded-xl rounded-tl-none">
                    <span className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 bg-ink-soft/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 bg-ink-soft/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 bg-ink-soft/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </GlassCard>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0 w-full">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={persona.inputPlaceholder}
          className={`flex-1 bg-surface-glass border border-border rounded-xl px-4 py-3 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 shadow-inner ${persona.ringAccentClass}`}
        />
        <GlassButton
          variant="primary"
          type="submit"
          className={`px-5 py-3 h-auto ${persona.buttonClass}`}
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Send</span>
        </GlassButton>
      </form>
    </motion.div>
  );
}
