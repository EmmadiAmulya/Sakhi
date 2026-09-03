/**
 * Hand-written Supabase database types matching supabase/migrations/*.sql.
 *
 * The Supabase CLI (`supabase gen types typescript`) can regenerate this once
 * the CLI is linked to the project — see docs. Until then these are maintained
 * by hand to mirror 0001_init.sql, 0002_rag.sql and 0003_habit_values.sql exactly.
 */

export type Flow = "spotting" | "light" | "medium" | "heavy";
export type Persona = "sakhi" | "maya";
export type ChatRole = "user" | "assistant" | "system";

export interface ProfileRow {
  id: string;
  name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  cycle_length: number | null;
  period_length: number | null;
  last_period_date: string | null;
  onboarded: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderPreferencesRow {
  user_id: string;
  period_reminder: boolean | null;
  log_nudge: boolean | null;
  supplement_reminder: boolean | null;
  reminder_time: string | null; // "HH:MM:SS"
  updated_at: string;
}

export interface CycleLogRow {
  id: string;
  user_id: string;
  log_date: string; // "YYYY-MM-DD"
  is_period: boolean | null;
  flow: Flow | null;
  symptoms: string[] | null;
  mood: string | null;
  energy: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoodLogRow {
  id: string;
  user_id: string;
  log_date: string;
  mood: string | null;
  energy: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface HabitLogRow {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  done: boolean | null;
  value: number | null; // 0003_habit_values.sql — quantitative metrics (ml, hours)
}

export interface SupplementRow {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  schedule: string | null;
  created_at: string;
}

export interface SupplementLogRow {
  id: string;
  user_id: string;
  supplement_id: string;
  log_date: string;
  taken: boolean | null;
}

export interface JournalEntryRow {
  id: string;
  user_id: string;
  content_json: unknown;
  plain_text: string | null;
  mood: string | null;
  cycle_phase: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionRow {
  id: string;
  user_id: string;
  persona: Persona;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  session_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

// 0002_rag.sql
export interface DocumentRow {
  id: string;
  title: string;
  source: string | null;
  created_at: string;
}

export interface DocumentChunkRow {
  id: string;
  document_id: string;
  content: string;
  embedding: number[] | null;
}
