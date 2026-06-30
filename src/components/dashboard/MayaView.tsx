"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User, Stethoscope, AlertTriangle, ShieldCheck, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import { PERSONAS } from "@/lib/personas";
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

    // Mock replies based on clinical context
    setTimeout(() => {
      setIsTyping(false);
      
      const containsEmergencyKeywords = /severe bleeding|haemorrhage|extreme cramps|severe pain|fainting|unconscious|fever|seizure/i.test(currentInput);
      const containsEmotionalKeywords = /sad|depressed|lonely|anxious|stress|cry|overwhelmed|mood/i.test(currentInput);

      let replyText = `For general wellness, here is a structured summary based on peer-reviewed guidelines:
• Ensure proper hydration (water, electrolytes) to stabilize metabolism.
• Micronutrients like Magnesium Glycinate (200mg) and Vitamin D3 (2000 IU) support cycle regulation.
• Engage in low-intensity restorative movement (yoga, walking).

If symptoms persist, please consult a qualified clinician.`;
      
      if (containsEmergencyKeywords) {
        replyText = `WARNING: The symptoms you described (severe pain, heavy bleeding, or high fever) may require immediate medical attention. Do not delay seeking professional treatment. Please refer to the emergency contacts provided below.`;
      } else if (containsEmotionalKeywords) {
        replyText = `I can provide nutritional recommendations and cycle support parameters. However, for emotional grounding, stress, and mood reflections, Sakhi is our dedicated companion.`;
      }

      const botMsg: Message = {
        id: `maya-${Date.now()}`,
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: containsEmergencyKeywords
      };

      setMessages(prev => {
        const nextMsgs = [...prev, botMsg];
        
        if (containsEmergencyKeywords) {
          nextMsgs.push({
            id: `emergency-card-${Date.now()}`,
            sender: "bot",
            text: "Emergency Helpline Directory",
            timestamp: "",
            isEmergency: true
          });
        } else if (containsEmotionalKeywords) {
          nextMsgs.push({
            id: `handoff-sakhi-${Date.now()}`,
            sender: "bot",
            text: "Need emotional support?",
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
            {messages.map((msg) => {
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
