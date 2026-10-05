/** Mood ids persisted in mood_logs / cycle_logs / journal_entries (0004 CHECK). */
export const MOODS = [
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
] as const;

export type MoodId = (typeof MOODS)[number]["id"];
