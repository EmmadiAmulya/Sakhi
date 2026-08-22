"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { toast } from "@/lib/toast";
import { todayStr } from "./mood-logs";
import type { HabitRow, HabitLogRow } from "./database.types";

export interface HabitWithStatus {
  id: string;
  name: string;
  icon: string | null;
  done: boolean;
}

/**
 * Full habits data layer. NOTE: the current dashboard's water/sleep trackers are
 * quantitative (ml / hours) and do not map onto the boolean habit_logs schema, so
 * they remain local (see SETUP.md). These hooks power any future boolean habit UI.
 */
export async function fetchHabitsToday(): Promise<HabitWithStatus[]> {
  const date = todayStr();
  const [{ data: habits, error: hErr }, { data: logs, error: lErr }] = await Promise.all([
    db().from("habits").select("*").order("created_at", { ascending: true }),
    db().from("habit_logs").select("*").eq("log_date", date),
  ]);
  if (hErr) throw new Error(hErr.message);
  if (lErr) throw new Error(lErr.message);

  const doneBy = new Map<string, boolean>();
  (logs as HabitLogRow[] | null)?.forEach((l) => doneBy.set(l.habit_id, Boolean(l.done)));

  return (habits as HabitRow[] | null ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    done: doneBy.get(h.id) ?? false,
  }));
}

export function useHabitsToday() {
  return useQuery({
    queryKey: [...queryKeys.habits, todayStr()],
    queryFn: fetchHabitsToday,
    staleTime: 60_000,
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  const date = todayStr();
  const key = [...queryKeys.habits, date];

  return useMutation({
    mutationFn: async (vars: { id: string; done: boolean }) => {
      const userId = await requireUserId();
      const { error } = await db()
        .from("habit_logs")
        .upsert(
          { user_id: userId, habit_id: vars.id, log_date: date, done: vars.done },
          { onConflict: "habit_id,log_date" }
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<HabitWithStatus[]>(key);
      if (prev) {
        qc.setQueryData<HabitWithStatus[]>(
          key,
          prev.map((h) => (h.id === vars.id ? { ...h, done: vars.done } : h))
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(`Couldn't update habit: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { name: string; icon?: string }) => {
      const userId = await requireUserId();
      const { error } = await db()
        .from("habits")
        .insert({ user_id: userId, name: vars.name, icon: vars.icon ?? null });
      if (error) throw new Error(error.message);
    },
    onError: (err) => {
      toast.error(`Couldn't add habit: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      toast.success("Habit added");
      qc.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await requireUserId();
      const { error } = await db().from("habits").delete().eq("id", id).eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
    onError: (err) => {
      toast.error(`Couldn't delete habit: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });
}
