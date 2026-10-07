"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PERSONAS, type Persona } from "@/lib/personas";
import { useChatHistory } from "@/lib/data/chat";
import { useProfileStore } from "@/lib/store/profile";
import { formatClockTime } from "@/lib/date";

export interface ChatUIMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  thinking?: string;
  isEmergency?: boolean;
}

/** Wire format for the route; assistant turns carry preserved reasoning for K3. */
type OutgoingMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning_content?: string;
};

// Backstop if the SSE stream stops yielding bytes (the route has its own watchdog).
const STREAM_INACTIVITY_MS = 90_000;

/**
 * Shared chat state for both personas: saved history + this session's messages,
 * the SSE send/stream flow (including K3 thinking tokens), and scrolling.
 */
export function usePersonaChat(personaId: Persona["id"]) {
  const profile = useProfileStore((state) => state.profile);
  const displayName = profile.name || "Amulya";
  const persona = PERSONAS[personaId];

  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: history } = useChatHistory(personaId);

  const view = useMemo<ChatUIMessage[]>(() => {
    const base: ChatUIMessage[] =
      history && history.length > 0
        ? history.map((m) => ({
            id: `hist-${m.createdAt}`,
            sender: m.role === "user" ? "user" : "bot",
            text: m.content,
            timestamp: formatClockTime(m.createdAt),
          }))
        : [
            {
              id: "init-1",
              sender: "bot",
              text: persona.introMessage.replace("{name}", displayName),
              timestamp: "",
            },
          ];
    return [...base, ...messages];
  }, [history, messages, displayName, persona.introMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, isTyping]);

  const appendBot = (text: string, isEmergency = false) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${personaId}-${Date.now()}`,
        sender: "bot",
        text,
        timestamp: formatClockTime(new Date()),
        isEmergency,
      },
    ]);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `usr-${Date.now()}`, sender: "user", text, timestamp: formatClockTime(new Date()) },
    ]);
    setInputVal("");
    setIsTyping(true);

    const botMsgId = `${personaId}-${Date.now()}`;
    let isEmergencyTriggered = false;
    let streamError: string | null = null;

    const abort = new AbortController();
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    const armWatchdog = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => abort.abort(), STREAM_INACTIVITY_MS);
    };

    try {
      const history_ = view
        .filter((m) => m.sender === "user" || (m.timestamp && !m.isEmergency))
        .map((m): OutgoingMessage =>
          m.sender === "user"
            ? { role: "user", content: m.text }
            : {
                role: "assistant",
                content: m.text,
                ...(m.thinking ? { reasoning_content: m.thinking } : {}),
              }
        );

      armWatchdog();
      const res = await fetch(`/api/chat/${personaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history_, { role: "user" as const, content: text }],
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        appendBot(data?.error ?? `Sorry ${displayName}, I couldn't respond just now. Please try again in a moment.`);
        return;
      }

      if (!res.body) {
        appendBot(`Sorry ${displayName}, empty response from server.`);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: botMsgId, sender: "bot", text: "", timestamp: formatClockTime(new Date()) },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        armWatchdog();

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr || dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.isEmergency) isEmergencyTriggered = true;
            if (parsed.error) streamError = String(parsed.error);
            if (parsed.thinking) {
              const chunk = String(parsed.thinking);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, thinking: (m.thinking ?? "") + chunk } : m
                )
              );
            }
            if (parsed.text) {
              const chunk = String(parsed.text);
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...m, text: m.text + chunk } : m))
              );
            }
          } catch {
            // Ignore partial SSE chunks.
          }
        }
      }

      if (streamError) {
        // Drop the empty placeholder when there's nothing to show, then surface the error.
        setMessages((prev) => {
          const bot = prev.find((m) => m.id === botMsgId);
          return bot && !bot.text && !bot.thinking ? prev.filter((m) => m.id !== botMsgId) : prev;
        });
        appendBot(streamError);
      } else if (isEmergencyTriggered) {
        appendBot("Emergency Helpline Directory", true);
      }
    } catch {
      appendBot(
        abort.signal.aborted
          ? `Sorry ${displayName}, that took too long. Please try again.`
          : `Sorry ${displayName}, I couldn't reach the server. Please check your connection and try again.`
      );
    } finally {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      setIsTyping(false);
    }
  };

  return { persona, view, isTyping, inputVal, setInputVal, handleSend, scrollRef };
}
