"use client";

import { db, requireUserId } from "./client";
import type {
  ChatMessageRow,
  ChatSessionRow,
  CycleLogRow,
  HabitLogRow,
  HabitRow,
  JournalEntryRow,
  MoodLogRow,
  ProfileRow,
  ReminderPreferencesRow,
  SupplementLogRow,
  SupplementRow,
} from "./database.types";

export interface SakhiExport {
  version: 1;
  exportedAt: string; // ISO
  profile: ProfileRow | null;
  cycle_logs: CycleLogRow[];
  mood_logs: MoodLogRow[];
  habits: HabitRow[];
  habit_logs: HabitLogRow[];
  supplements: SupplementRow[];
  supplement_logs: SupplementLogRow[];
  journal_entries: JournalEntryRow[];
  reminder_preferences: ReminderPreferencesRow | null;
  chat_sessions: ChatSessionRow[];
  chat_messages: ChatMessageRow[];
}

const ARRAY_TABLES = [
  "cycle_logs",
  "mood_logs",
  "habits",
  "habit_logs",
  "supplements",
  "supplement_logs",
  "journal_entries",
  "chat_sessions",
  "chat_messages",
] as const;

export async function fetchUserDataExport(): Promise<SakhiExport> {
  await requireUserId();

  const [
    profile,
    cycleLogs,
    moodLogs,
    habits,
    habitLogs,
    supplements,
    supplementLogs,
    journalEntries,
    reminders,
    chatSessions,
    chatMessages,
  ] = await Promise.all([
    db().from("profiles").select("*").maybeSingle(),
    db().from("cycle_logs").select("*"),
    db().from("mood_logs").select("*"),
    db().from("habits").select("*"),
    db().from("habit_logs").select("*"),
    db().from("supplements").select("*"),
    db().from("supplement_logs").select("*"),
    db().from("journal_entries").select("*"),
    db().from("reminder_preferences").select("*").maybeSingle(),
    db().from("chat_sessions").select("*"),
    db().from("chat_messages").select("*"),
  ]);

  for (const res of [profile, cycleLogs, moodLogs, habits, habitLogs, supplements, supplementLogs, journalEntries, reminders, chatSessions, chatMessages]) {
    if (res.error) throw new Error(res.error.message);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: (profile.data ?? null) as ProfileRow | null,
    cycle_logs: (cycleLogs.data ?? []) as CycleLogRow[],
    mood_logs: (moodLogs.data ?? []) as MoodLogRow[],
    habits: (habits.data ?? []) as HabitRow[],
    habit_logs: (habitLogs.data ?? []) as HabitLogRow[],
    supplements: (supplements.data ?? []) as SupplementRow[],
    supplement_logs: (supplementLogs.data ?? []) as SupplementLogRow[],
    journal_entries: (journalEntries.data ?? []) as JournalEntryRow[],
    reminder_preferences: (reminders.data ?? null) as ReminderPreferencesRow | null,
    chat_sessions: (chatSessions.data ?? []) as ChatSessionRow[],
    chat_messages: (chatMessages.data ?? []) as ChatMessageRow[],
  };
}

export function downloadUserDataExport(data: SakhiExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sakhi-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isRowArray(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every(isRecord);
}

async function upsertTable(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<string | null> {
  if (rows.length === 0) return null;
  const { error } = await db().from(table).upsert(rows, { onConflict });
  return error ? error.message : null;
}

export async function importUserDataExport(
  raw: unknown
): Promise<{ imported: string[]; errors: string[] }> {
  const imported: string[] = [];
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return { imported, errors: ["Backup file is not a JSON object."] };
  }
  if (raw.version !== 1) {
    return { imported, errors: ["Unsupported backup version (expected 1)."] };
  }
  for (const key of ARRAY_TABLES) {
    if (!isRowArray(raw[key])) {
      return { imported, errors: [`Backup is missing or has an invalid "${key}" list.`] };
    }
  }
  if (raw.profile !== null && !isRecord(raw.profile)) {
    return { imported, errors: ['Invalid "profile" in backup.'] };
  }
  if (raw.reminder_preferences !== null && !isRecord(raw.reminder_preferences)) {
    return { imported, errors: ['Invalid "reminder_preferences" in backup.'] };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return { imported, errors: [e instanceof Error ? e.message : "Not signed in."] };
  }

  const own = (row: Record<string, unknown>) => ({ ...row, user_id: userId });

  // Profile: id column mirrors the auth user id, so overwrite that instead.
  if (raw.profile) {
    const err = await upsertTable("profiles", [{ ...raw.profile, id: userId }], "id");
    err ? errors.push(`profiles: ${err}`) : imported.push("profiles");
  }

  const exportedHabits = raw.habits as Record<string, unknown>[];
  const habitIdToName = new Map<string, string>();
  for (const h of exportedHabits) {
    if (typeof h.id === "string" && typeof h.name === "string") habitIdToName.set(h.id, h.name);
  }

  const habitNameToNewId = new Map<string, string>();
  if (exportedHabits.length > 0) {
    const { data: upsertedHabits, error: habitsErr } = await db()
      .from("habits")
      .upsert(exportedHabits.map(own), { onConflict: "user_id,name" })
      .select("id,name");
    if (habitsErr) {
      errors.push(`habits: ${habitsErr.message}`);
    } else {
      imported.push("habits");
      for (const h of (upsertedHabits ?? []) as { id: string; name: string }[]) {
        if (!habitNameToNewId.has(h.name)) habitNameToNewId.set(h.name, h.id);
      }
    }
  }

  const habitLogs = raw.habit_logs as Record<string, unknown>[];
  const remappedHabitLogs: Record<string, unknown>[] = [];
  let skippedHabitLogs = 0;
  for (const log of habitLogs) {
    const name = typeof log.habit_id === "string" ? habitIdToName.get(log.habit_id) : undefined;
    const newId = name ? habitNameToNewId.get(name) : undefined;
    if (newId) remappedHabitLogs.push({ ...own(log), habit_id: newId });
    else skippedHabitLogs += 1;
  }
  if (skippedHabitLogs > 0) errors.push(`habit_logs: skipped ${skippedHabitLogs} row(s) with unknown habit`);
  const habitLogsErr = await upsertTable("habit_logs", remappedHabitLogs, "habit_id,log_date");
  if (habitLogsErr) errors.push(`habit_logs: ${habitLogsErr}`);
  else if (remappedHabitLogs.length > 0) imported.push("habit_logs");

  const exportedSupplements = raw.supplements as Record<string, unknown>[];
  let validSupplementIds = new Set<string>();
  if (exportedSupplements.length > 0) {
    const { data: upsertedSupplements, error: supplementsErr } = await db()
      .from("supplements")
      .upsert(exportedSupplements.map(own), { onConflict: "id" })
      .select("id");
    if (supplementsErr) errors.push(`supplements: ${supplementsErr.message}`);
    else {
      imported.push("supplements");
      validSupplementIds = new Set(((upsertedSupplements ?? []) as { id: string }[]).map((s) => s.id));
    }
  }

  const supplementLogs = raw.supplement_logs as Record<string, unknown>[];
  const remappedSupplementLogs: Record<string, unknown>[] = [];
  let skippedSupplementLogs = 0;
  for (const log of supplementLogs) {
    if (typeof log.supplement_id === "string" && validSupplementIds.has(log.supplement_id)) {
      remappedSupplementLogs.push(own(log));
    } else {
      skippedSupplementLogs += 1;
    }
  }
  if (skippedSupplementLogs > 0) errors.push(`supplement_logs: skipped ${skippedSupplementLogs} row(s) with unknown supplement`);
  const supplementLogsErr = await upsertTable("supplement_logs", remappedSupplementLogs, "supplement_id,log_date");
  if (supplementLogsErr) errors.push(`supplement_logs: ${supplementLogsErr}`);
  else if (remappedSupplementLogs.length > 0) imported.push("supplement_logs");

  const restore = async (table: string, rows: Record<string, unknown>[], onConflict: string) => {
    const err = await upsertTable(table, rows.map(own), onConflict);
    if (err) errors.push(`${table}: ${err}`);
    else if (rows.length > 0) imported.push(table);
  };

  await restore("cycle_logs", raw.cycle_logs as Record<string, unknown>[], "user_id,log_date");
  await restore("mood_logs", raw.mood_logs as Record<string, unknown>[], "user_id,log_date");
  await restore("journal_entries", raw.journal_entries as Record<string, unknown>[], "id");

  if (raw.reminder_preferences) {
    const err = await upsertTable("reminder_preferences", [own(raw.reminder_preferences)], "user_id");
    err ? errors.push(`reminder_preferences: ${err}`) : imported.push("reminder_preferences");
  }

  const exportedSessions = raw.chat_sessions as Record<string, unknown>[];
  let validSessionIds = new Set<string>();
  if (exportedSessions.length > 0) {
    const { data: upsertedSessions, error: sessionsErr } = await db()
      .from("chat_sessions")
      .upsert(exportedSessions.map(own), { onConflict: "id" })
      .select("id");
    if (sessionsErr) errors.push(`chat_sessions: ${sessionsErr.message}`);
    else {
      imported.push("chat_sessions");
      validSessionIds = new Set(((upsertedSessions ?? []) as { id: string }[]).map((s) => s.id));
    }
  }

  const messages = raw.chat_messages as Record<string, unknown>[];
  const remappedMessages: Record<string, unknown>[] = [];
  let skippedMessages = 0;
  for (const m of messages) {
    if (typeof m.session_id === "string" && validSessionIds.has(m.session_id)) {
      remappedMessages.push(own(m));
    } else {
      skippedMessages += 1;
    }
  }
  if (skippedMessages > 0) errors.push(`chat_messages: skipped ${skippedMessages} row(s) with unknown session`);
  const messagesErr = await upsertTable("chat_messages", remappedMessages, "id");
  if (messagesErr) errors.push(`chat_messages: ${messagesErr}`);
  else if (remappedMessages.length > 0) imported.push("chat_messages");

  return { imported, errors };
}
