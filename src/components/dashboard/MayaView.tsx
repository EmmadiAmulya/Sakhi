"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Send, User, Stethoscope, AlertTriangle, ShieldCheck, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import { PERSONAS } from "@/lib/personas";
import { useChatHistory } from "@/lib/data/chat";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants } from "@/lib/motion";

interface MayaViewProps {
  setActiveTab: (tab: string) => void;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  isSuggestion?: boolean;
}

export default function MayaView({ setActiveTab }: MayaViewProps) {
  const profile = useProfileStore((state) => state.profile);
  const displayName = profile.name || "Amulya";
  const persona = PERSONAS.maya;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Saved conversation (or intro bubble) plus this session's new messages.
  const { data: history } = useChatHistory("maya");
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const view = useMemo<Message[]>(() => {
    const base: Message[] =
      history && history.length > 0
        ? history.map((m) => ({
            id: `hist-${m.createdAt}`,
            sender: m.role === "user" ? "user" : "bot",
            text: m.content,
            timestamp: fmtTime(m.createdAt),
          }))
        : [{
            id: "init-1",
            sender: "bot",
            text: persona.introMessage.replace("{name}", displayName),
            timestamp: "",
          }];
    return [...base, ...messages];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, messages, displayName]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, isTyping]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const appendBot = (text: string, isEmergency = false) => {
    setMessages(prev => [...prev, {
      id: `maya-${Date.now()}`,
      sender: "bot",
      text,
      timestamp: now(),
      isEmergency,
    }]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      const res = await fetch(`/api/chat/maya`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: view
            .filter(m => m.sender === "user" || (!m.isSuggestion && !m.isEmergency && m.timestamp))
            .map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.reply) {
        appendBot(data.reply);
      } else {
        appendBot(data?.error ?? `Sorry ${displayName}, I couldn't respond just now. Please try again in a moment.`);
      }
    } catch {
      appendBot(`Sorry ${displayName}, I couldn't reach the server. Please check your connection and try again.`);
    } finally {
      setIsTyping(false);
    }
  };

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
          <div className="h-10 w-10 rounded-full bg-plum/15 border border-plum/30 flex items-center justify-center text-plum">
            <Stethoscope className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-ink-text leading-tight">{persona.name}</h1>
            <p className="text-[10px] text-ink-soft">{persona.tagline}</p>
          </div>
        </div>
        
        {/* Persistent Handoff Chip */}
        <button
          onClick={() => setActiveTab("sakhi")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-sakura-deep/10 text-sakura-deep border border-sakura-deep/20 hover:bg-sakura-deep/20 transition-all select-none cursor-pointer"
        >
          <span>🌸 Ask Sakhi</span>
        </button>
      </section>

      {/* Messages Panel */}
      <GlassCard className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col min-h-0 relative rounded-3xl">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <AnimatePresence initial={false}>
            {view.map((msg) => {
              const isUser = msg.sender === "user";
              
              // Render Emergency Cards
              if (msg.isEmergency && msg.isEmergency === true && msg.sender === "bot" && msg.text === "Emergency Helpline Directory") {
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
                        <div>
                          <p className="font-semibold text-plum uppercase text-[9px] tracking-wider border-b border-border/20 pb-0.5 mb-1">India</p>
                          <ul className="space-y-1 pl-1">
                            <li>&bull; <span className="font-bold">Medical Emergency:</span> dial <span className="font-bold text-red-600">108</span></li>
                            <li>&bull; <span className="font-bold">Maternal/Infant Ambulance:</span> dial <span className="font-bold text-red-600">102</span></li>
                            <li>&bull; <span className="font-bold">Unified Emergency:</span> dial <span className="font-bold text-red-600">112</span></li>
                            <li>&bull; <span className="font-bold">iCall Counselling Line:</span> Call <span className="font-bold">9152987821</span></li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-plum uppercase text-[9px] tracking-wider border-b border-border/20 pb-0.5 mb-1">United States</p>
                          <ul className="space-y-1 pl-1">
                            <li>&bull; <span className="font-bold">Medical Services:</span> dial <span className="font-bold text-red-600">911</span></li>
                            <li>&bull; <span className="font-bold">Crisis &amp; Mental Health Line:</span> dial <span className="font-bold text-red-600">988</span></li>
                          </ul>
                        </div>
                        {/* TODO: Add international helpline lookup databases for auto-localization in production build */}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Render Handoff Suggestions
              if (msg.isSuggestion) {
                return (
                  <motion.div
                    key={msg.id}
                    variants={itemVariants}
                    className="flex justify-start w-full pl-11"
                  >
                    <div className="bg-sakura/5 border border-sakura-deep/20 rounded-2xl p-3.5 max-w-[80%] text-xs space-y-2.5">
                      <p className="font-medium text-sakura-deep flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 fill-sakura-deep/20" />
                        Handoff to Emotional Support Recommended
                      </p>
                      <p className="text-[11px] text-ink-soft leading-normal">
                        Sakhi provides a gentle, listening environment to talk through stress, cycles, and mood fluctuations.
                      </p>
                      <GlassButton
                        variant="primary"
                        onClick={() => setActiveTab("sakhi")}
                        className="py-1 px-3 text-[10px]"
                      >
                        Ask Sakhi 🌸
                      </GlassButton>
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
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      isUser 
                        ? "bg-sakura-deep/10 border-sakura-deep/30 text-sakura-deep" 
                        : "bg-plum/10 border-plum/30 text-plum"
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                    </div>
                    
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm flex flex-col ${
                      isUser
                        ? "bg-sakura-deep/15 text-ink-text border border-sakura-deep/20 rounded-tr-none"
                        : "bg-surface-white/95 text-ink-text border border-border/80 rounded-tl-none"
                    }`}>
                      <div className="whitespace-pre-line">{msg.text}</div>
                      
                      {/* Safety Disclaimer overlay on Bot messages */}
                      {!isUser && persona.disclaimer && (
                        <div className="mt-3 pt-2 border-t border-border/30 flex items-start gap-1 text-[9px] font-medium text-ink-soft/90 italic leading-snug">
                          <ShieldCheck className="h-3 w-3 text-plum flex-shrink-0 mt-0.5" />
                          <span>{persona.disclaimer}</span>
                        </div>
                      )}

                      {msg.timestamp && (
                        <span className="block text-[8px] text-ink-soft/70 text-right mt-1.5">{msg.timestamp}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start w-full animate-pulse"
              >
                <div className="flex gap-3 items-center pl-1">
                  <div className="h-8 w-8 rounded-full bg-plum/10 border border-plum/30 text-plum flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="bg-surface-white/80 border border-border/85 px-4 py-2 rounded-xl rounded-tl-none">
                    <span className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 bg-ink-soft/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-ink-soft/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-ink-soft/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          placeholder={`Ask Maya about symptoms, cycle phases, and remedies...`}
          className="flex-1 bg-surface-glass border border-border rounded-xl px-4 py-3 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-plum/35 shadow-inner"
        />
        <GlassButton variant="primary" type="submit" className="px-5 py-3 h-auto bg-plum hover:bg-plum-hover text-white border-transparent">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Send</span>
        </GlassButton>
      </form>
    </motion.div>
  );
}
