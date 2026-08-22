/** Centralized TanStack Query key factory for the data layer. */
export const queryKeys = {
  profile: ["profile"] as const,
  cycleLogs: ["cycle_logs"] as const,
  moodLogs: ["mood_logs"] as const,
  habits: ["habits"] as const,
  habitLogs: (date: string) => ["habit_logs", date] as const,
  supplements: ["supplements"] as const,
  supplementLogs: (date: string) => ["supplement_logs", date] as const,
  journalEntries: ["journal_entries"] as const,
  reminders: ["reminder_preferences"] as const,
  chatSessions: (persona: string) => ["chat_sessions", persona] as const,
  chatMessages: (sessionId: string) => ["chat_messages", sessionId] as const,
};
