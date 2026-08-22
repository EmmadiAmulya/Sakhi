"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todayStr } from "./mood-logs";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { toast } from "@/lib/toast";

/**
 * Quantitative daily habits (water ml, sleep hours) stored as habit rows with
 * a numeric value on habit_logs. Habit rows are created on first use by name.
 */

async function getHabitId(name: string): Promise<string> {
  const userId = await requireUserId();
  const { data: existing, error: selErr } = await db()
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return (existing as { id: string }).id;

  const { data: created, error: insErr } = await db()
    .from("habits")
    .insert({ user_id: userId, name })
    .select("id")
    .single();
  if (insErr) {
    // Race: another tab created it first — re-read instead of failing.
    const { data: retry, error: retryErr } = await db()
      .from("habits")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .maybeSingle();
    if (retryErr || !retry) throw new Error(insErr.message);
    return (retry as { id: string }).id;
  }
  return (created as { id: string }).id;
}

export function useHabitValue(name: string) {
  const date = todayStr();
  return useQuery({
    queryKey: [...queryKeys.habitLogs(date), name],
    queryFn: async (): Promise<number | null> => {
      const userId = await requireUserId();
      const { data, error } = await db()
        .from("habit_logs")
        .select("value, habit_id, habits!inner(name)")
        .eq("user_id", userId)
        .eq("log_date", date)
        .eq("habits.name", name)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return (data as unknown as { value: number | null }).value;
    },
    staleTime: 60_000,
  });
}

export function useSetHabitValue(name: string) {
  const qc = useQueryClient();
  const date = todayStr();
  const key = [...queryKeys.habitLogs(date), name];

  return useMutation({
    mutationFn: async (value: number) => {
      const habitId = await getHabitId(name);
      const { error } = await db()
        .from("habit_logs")
        .upsert(
          { user_id: (await requireUserId()), habit_id: habitId, log_date: date, value, done: value > 0 },
          { onConflict: "habit_id,log_date" }
        );
      if (error) throw new Error(error.message);
    },
    onMutate: (value) => {
      qc.setQueryData<number | null>(key, value);
    },
    onError: (err) => {
      void qc.invalidateQueries({ queryKey: key });
      toast.error(`Couldn't save ${name.toLowerCase()}: ${err instanceof Error ? err.message : "unknown error"}`);
    },
  });
}
