"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { toast } from "@/lib/toast";
import type { MoodLogRow } from "./database.types";

export interface MoodLog {
  mood: string | null;
  energy: number | null;
  note: string | null;
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export async function fetchMoodLog(date: string): Promise<MoodLog | null> {
  const { data, error } = await db()
    .from("mood_logs")
    .select("*")
    .eq("log_date", date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as MoodLogRow;
  return { mood: row.mood, energy: row.energy, note: row.note };
}

/** Today's mood log (query-cache is the source of truth; no store slice reads it). */
export function useTodayMoodLog() {
  const date = todayStr();
  return useQuery({
    queryKey: [...queryKeys.moodLogs, date],
    queryFn: () => fetchMoodLog(date),
    staleTime: 60_000,
  });
}

export function useUpsertMoodLog() {
  const qc = useQueryClient();
  const date = todayStr();
  const key = [...queryKeys.moodLogs, date];

  return useMutation({
    mutationFn: async (vars: Partial<MoodLog>) => {
      const userId = await requireUserId();
      // UNIQUE(user_id, log_date) (0004) → true upsert.
      const { error } = await db()
        .from("mood_logs")
        .upsert(
          {
            user_id: userId,
            log_date: date,
            mood: vars.mood ?? null,
            energy: vars.energy ?? null,
            note: vars.note ?? null,
          },
          { onConflict: "user_id,log_date" }
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<MoodLog | null>(key);
      const next: MoodLog = {
        mood: vars.mood ?? prev?.mood ?? null,
        energy: vars.energy ?? prev?.energy ?? null,
        note: vars.note ?? prev?.note ?? null,
      };
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      toast.error(`Couldn't save your mood: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      toast.success("Mood logged");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
