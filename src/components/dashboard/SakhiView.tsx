"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User, AlertCircle, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import { PERSONAS } from "@/lib/personas";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants } from "@/lib/motion";

interface SakhiViewProps {
  setActiveTab: (tab: string) => void;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isSuggestion?: boolean;
}

export default function SakhiView({ setActiveTab }: SakhiViewProps) {
  const profile = useProfileStore((state) => state.profile);
  const displayName = profile.name || "Amulya";
  const persona = PERSONAS.sakhi;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "bot",
      text: persona.introMessage.replace("{name}", displayName),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputVal;
    setInputVal("");
    setIsTyping(true);

    // Mock replies based on context
    setTimeout(() => {
      setIsTyping(false);
      
      const containsMedicalKeywords = /dosage|dose|cramps|pain|bleeding|medicine|pill|medication|doctor|clinic|treatment|diagnose/i.test(currentInput);

      let replyText = `I hear you, ${displayName}. It's completely valid to feel this way during your cycle. Let's focus on taking a deep breath and treating yourself gently today. I am here for you.`;
      
      if (containsMedicalKeywords) {
        replyText = `I want to make sure you get the most accurate medical information, ${displayName}. I can talk you through how you're feeling emotionally, but for symptom analysis and clinical guidance, Maya (our health guide) is better equipped.`;
      }

      const botMsg: Message = {
        id: `sakhi-${Date.now()}`,
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => {
        const nextMsgs = [...prev, botMsg];
        if (containsMedicalKeywords) {
          nextMsgs.push({
            id: `handoff-${Date.now()}`,
            sender: "bot",
            text: "Need medical or symptom advice?",
            timestamp: "",
            isSuggestion: true
          });
        }
        return nextMsgs;
      });
    }, 1500);
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
          <div className="h-10 w-10 rounded-full bg-sakura-deep/15 border border-sakura-deep/30 flex items-center justify-center text-sakura-deep">
            <Heart className="h-5.5 w-5.5 fill-sakura-deep/30" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-ink-text leading-tight">{persona.name}</h1>
            <p className="text-[10px] text-ink-soft">{persona.tagline}</p>
          </div>
        </div>
        
        {/* Persistent Handoff Chip */}
        <button
          onClick={() => setActiveTab("maya")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-plum/10 text-plum border border-plum/20 hover:bg-plum/20 transition-all select-none cursor-pointer"
        >
          <span>🩺 Ask Maya</span>
        </button>
      </section>

      {/* Messages Panel */}
      <GlassCard className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col min-h-0 relative rounded-3xl">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              
              if (msg.isSuggestion) {
                return (
                  <motion.div
                    key={msg.id}
                    variants={itemVariants}
                    className="flex justify-start w-full pl-11"
                  >
                    <div className="bg-plum/5 border border-plum/25 rounded-2xl p-3.5 max-w-[80%] text-xs space-y-2.5">
                      <p className="font-medium text-plum flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Handoff to Medical Guide Recommended
                      </p>
                      <p className="text-[11px] text-ink-soft leading-normal">
                        Maya can answer clinical questions regarding dosages, symptoms, and biological regularities.
                      </p>
                      <GlassButton
                        variant="primary"
                        onClick={() => setActiveTab("maya")}
                        className="py-1 px-3 text-[10px] bg-plum hover:bg-plum-hover text-white border-transparent"
                      >
                        Ask Maya 🩺
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
                        : "bg-sakura-deep/15 border-sakura-deep/20 text-sakura-deep"
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Heart className="h-4 w-4 fill-sakura-deep/20" />}
                    </div>
                    
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-sakura-deep/15 text-ink-text border border-sakura-deep/20 rounded-tr-none"
                        : "bg-surface-white/95 text-ink-text border border-border/80 rounded-tl-none"
                    }`}>
                      <p>{msg.text}</p>
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
                  <div className="h-8 w-8 rounded-full bg-sakura-deep/10 border border-sakura-deep/30 text-sakura-deep flex items-center justify-center">
                    <Heart className="h-4 w-4 fill-sakura-deep/20 animate-pulse" />
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
          placeholder={`Talk to Sakhi...`}
          className="flex-1 bg-surface-glass border border-border rounded-xl px-4 py-3 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-sakura-deep/30 shadow-inner"
        />
        <GlassButton variant="primary" type="submit" className="px-5 py-3 h-auto">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Send</span>
        </GlassButton>
      </form>
    </motion.div>
  );
}
