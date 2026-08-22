"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { useProfileStore } from "@/lib/store/profile";
import { toast } from "@/lib/toast";
import type { CycleLog } from "@/lib/cycle";
import type { CycleLogRow } from "./database.types";

function rowToLog(row: CycleLogRow): CycleLog {
  return {
    date: row.log_date,
    isPeriod: row.is_period ?? false,
    flow: row.flow ?? undefined,
    symptoms: row.symptoms ?? [],
    mood: row.mood ?? undefined,
    energy: row.energy ?? undefined,
    note: row.note ?? undefined,
  };
}

export async function fetchCycleLogs(): Promise<Record<string, CycleLog>> {
  // RLS scopes rows to the current user, so no explicit user_id filter is needed.
  const { data, error } = await db().from("cycle_logs").select("*");
  if (error) throw new Error(error.message);
  const record: Record<string, CycleLog> = {};
  (data as CycleLogRow[] | null)?.forEach((row) => {
    record[row.log_date] = rowToLog(row);
  });
  return record;
}

/**
 * Loads cycle logs from Supabase and hydrates the Zustand store (the client
 * cache that the calendar/journal/trends views read from). Call once per view.
 */
export function useCycleLogsSync() {
  const query = useQuery({
    queryKey: queryKeys.cycleLogs,
    queryFn: fetchCycleLogs,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      useProfileStore.setState({ cycleLogs: query.data });
    }
  }, [query.data]);

  return query;
}

export function useUpsertCycleLog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { date: string; log: Partial<CycleLog> }) => {
      const userId = await requireUserId();
      const existing = useProfileStore.getState().cycleLogs[vars.date];
      const base: CycleLog = existing ?? { date: vars.date, isPeriod: false, symptoms: [] };
      const merged: CycleLog = { ...base, ...vars.log, date: vars.date };
      const { error } = await db()
        .from("cycle_logs")
        .upsert(
          {
            user_id: userId,
            log_date: vars.date,
            is_period: merged.isPeriod,
            flow: merged.isPeriod ? merged.flow ?? "medium" : null,
            symptoms: merged.symptoms ?? [],
            mood: merged.mood ?? null,
            energy: merged.energy ?? null,
            note: merged.note ?? null,
          },
          { onConflict: "user_id,log_date" }
        );
      if (error) throw new Error(error.message);
      return merged;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: queryKeys.cycleLogs });
      const prev = useProfileStore.getState().cycleLogs;
      const existing = prev[vars.date] ?? { date: vars.date, isPeriod: false, symptoms: [] };
      const merged = { ...existing, ...vars.log };
      useProfileStore.setState({ cycleLogs: { ...prev, [vars.date]: merged } });
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) useProfileStore.setState({ cycleLogs: ctx.prev });
      toast.error(`Couldn't save your log: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      toast.success("Log saved");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cycleLogs });
    },
  });
}

export function useDeleteCycleLog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const userId = await requireUserId();
      const { error } = await db()
        .from("cycle_logs")
        .delete()
        .eq("user_id", userId)
        .eq("log_date", date);
      if (error) throw new Error(error.message);
    },
    onMutate: async (date) => {
      await qc.cancelQueries({ queryKey: queryKeys.cycleLogs });
      const prev = useProfileStore.getState().cycleLogs;
      const next = { ...prev };
      delete next[date];
      useProfileStore.setState({ cycleLogs: next });
      return { prev };
    },
    onError: (err, _date, ctx) => {
      if (ctx?.prev) useProfileStore.setState({ cycleLogs: ctx.prev });
      toast.error(`Couldn't delete your log: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      toast.success("Log removed");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cycleLogs });
    },
  });
}
