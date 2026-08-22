"use client";

import { useQuery } from "@tanstack/react-query";
import { db } from "./client";
import { queryKeys } from "./keys";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Messages from the user's most recent session with this persona (oldest first). */
export function useChatHistory(persona: "sakhi" | "maya") {
  return useQuery({
    queryKey: queryKeys.chatSessions(persona),
    queryFn: async (): Promise<HistoryMessage[]> => {
      try {
        const { data: session } = await db()
          .from("chat_sessions")
          .select("id")
          .eq("persona", persona)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!session) return [];

        const { data: msgs, error } = await db()
          .from("chat_messages")
          .select("role, content, created_at")
          .eq("session_id", session.id)
          .neq("role", "system")
          .order("created_at");
        if (error) throw new Error(error.message);
        return (msgs ?? []).map((m) => ({
          role: m.role as HistoryMessage["role"],
          content: m.content,
          createdAt: m.created_at,
        }));
      } catch {
        // Signed-out or transient failure — an empty history is a fine fallback.
        return [];
      }
    },
    staleTime: Infinity,
    gcTime: 0,
  });
}
