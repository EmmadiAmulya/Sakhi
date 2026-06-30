"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { mockCompanionMessages, CompanionMessage } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants } from "@/lib/motion";

export default function CompanionView() {
  const [messages, setMessages] = useState<CompanionMessage[]>(mockCompanionMessages);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: CompanionMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    // Simulate comforting AI response after 1.5s
    setTimeout(() => {
      setIsTyping(false);
      const companionMsg: CompanionMessage = {
        id: `comp-${Date.now()}`,
        sender: "companion",
        text: "I hear you, Amulya. Nurturing yourself through little steps like hydration and gentle breathing can create a wonderful anchor. I am always right here if you need to talk or log anything else.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, companionMsg]);
    }, 1500);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]"
    >
      {/* Title */}
      <section className="space-y-1.5 flex-shrink-0">
        <h1 className="font-serif text-3xl font-bold text-ink-text flex items-center gap-2">
          <Heart className="h-6 w-6 text-sakura-deep fill-sakura-deep/20" />
          Empathetic Companion
        </h1>
        <p className="text-xs text-ink-soft">
          A gentle, private, warm conversation space. Your sharing remains strictly stored in local workspace state.
        </p>
      </section>

      {/* Chat Messages Panel */}
      <GlassCard className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col space-y-4 min-h-0 relative">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <motion.div
                  key={msg.id}
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      isUser 
                        ? "bg-sakura-deep/10 border-sakura-deep/30 text-sakura-deep" 
                        : "bg-plum/10 border-plum/30 text-plum"
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>
                    
                    {/* Balloon */}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-sakura-deep/20 text-ink-text border border-sakura-deep/20 rounded-tr-none"
                        : "bg-surface-white/90 text-ink-text border border-border/80 rounded-tl-none"
                    }`}>
                      <p>{msg.text}</p>
                      <span className="block text-[8px] text-ink-soft/70 text-right mt-1.5">{msg.timestamp}</span>
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
                className="flex justify-start w-full"
              >
                <div className="flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-full bg-plum/10 border border-plum/30 text-plum flex items-center justify-center">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="bg-surface-white/80 border border-border/80 px-4 py-2.5 rounded-2xl rounded-tl-none">
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

      {/* Input controls */}
      <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0 w-full">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Talk to Companion..."
          id="chat-input"
          className="flex-1 bg-surface-glass/95 border border-border rounded-xl px-4 py-3 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-sakura-deep/40 shadow-inner backdrop-blur-md"
        />
        <GlassButton variant="primary" type="submit" className="px-4 py-3 h-auto">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </GlassButton>
      </form>
    </motion.div>
  );
}
