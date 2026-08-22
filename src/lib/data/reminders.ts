"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { useProfileStore, type ReminderPreferences } from "@/lib/store/profile";
import { toast } from "@/lib/toast";
import type { ReminderPreferencesRow } from "./database.types";

function rowToReminders(row: ReminderPreferencesRow): ReminderPreferences {
  const upcomingPeriod = row.period_reminder ?? false;
  const dailyLogNudge = row.log_nudge ?? false;
  const supplementAlert = row.supplement_reminder ?? false;
  return {
    // `enabled` is a client-only master switch (no DB column); derive it as
    // "any sub-toggle is on" on hydrate.
    enabled: upcomingPeriod || dailyLogNudge || supplementAlert,
    upcomingPeriod,
    dailyLogNudge,
    supplementAlert,
    time: row.reminder_time ? row.reminder_time.substring(0, 5) : "09:00",
  };
}

export async function fetchReminders(): Promise<ReminderPreferences | null> {
  const { data, error } = await db().from("reminder_preferences").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToReminders(data as ReminderPreferencesRow) : null;
}

export function useRemindersSync() {
  const query = useQuery({
    queryKey: queryKeys.reminders,
    queryFn: fetchReminders,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      useProfileStore.setState({ reminders: query.data });
    }
  }, [query.data]);

  return query;
}

export function useUpdateReminders() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<ReminderPreferences>) => {
      const userId = await requireUserId();
      const merged = { ...useProfileStore.getState().reminders, ...prefs };
      const { error } = await db()
        .from("reminder_preferences")
        .upsert(
          {
            user_id: userId,
            period_reminder: merged.upcomingPeriod,
            log_nudge: merged.dailyLogNudge,
            supplement_reminder: merged.supplementAlert,
            reminder_time: merged.time ? `${merged.time}:00` : "09:00:00",
          },
          { onConflict: "user_id" }
        );
      if (error) throw new Error(error.message);
      return merged;
    },
    onMutate: async (prefs) => {
      await qc.cancelQueries({ queryKey: queryKeys.reminders });
      const prev = useProfileStore.getState().reminders;
      useProfileStore.setState({ reminders: { ...prev, ...prefs } });
      return { prev };
    },
    onError: (err, _prefs, ctx) => {
      if (ctx?.prev) useProfileStore.setState({ reminders: ctx.prev });
      toast.error(
        `Couldn't update reminders: ${err instanceof Error ? err.message : "unknown error"}`
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reminders });
    },
  });
}
