"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { toast } from "@/lib/toast";
import { todayStr } from "./mood-logs";
import type { SupplementRow, SupplementLogRow } from "./database.types";

export interface SupplementWithStatus {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string;
  taken: boolean;
}

/**
 * Starter set seeded on first load, because the locked dashboard UI has no
 * "add supplement" control. Seeding runs only when the user has zero supplements
 * (idempotent). Users can later manage these once a management UI exists.
 */
const DEFAULT_SUPPLEMENTS: { name: string; dose: string; schedule: string }[] = [
  { name: "Folic Acid", dose: "400 mcg", schedule: "Morning" },
  { name: "Vitamin D3", dose: "2000 IU", schedule: "Morning" },
  { name: "Magnesium Glycinate", dose: "200 mg", schedule: "Evening" },
  { name: "Omega 3 Fish Oil", dose: "1000 mg", schedule: "Afternoon" },
];

async function seedDefaultsIfEmpty(userId: string): Promise<void> {
  const { count, error } = await db()
    .from("supplements")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;
  const { error: insErr } = await db()
    .from("supplements")
    .insert(DEFAULT_SUPPLEMENTS.map((s) => ({ user_id: userId, ...s })));
  if (insErr) throw new Error(insErr.message);
}

export async function fetchSupplementsToday(): Promise<SupplementWithStatus[]> {
  const userId = await requireUserId();
  await seedDefaultsIfEmpty(userId);

  const date = todayStr();
  const [{ data: sups, error: supErr }, { data: logs, error: logErr }] = await Promise.all([
    db().from("supplements").select("*").order("created_at", { ascending: true }),
    db().from("supplement_logs").select("*").eq("log_date", date),
  ]);
  if (supErr) throw new Error(supErr.message);
  if (logErr) throw new Error(logErr.message);

  const takenBy = new Map<string, boolean>();
  (logs as SupplementLogRow[] | null)?.forEach((l) => takenBy.set(l.supplement_id, Boolean(l.taken)));

  return (sups as SupplementRow[] | null ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    dosage: s.dose ?? "",
    timeOfDay: s.schedule ?? "",
    taken: takenBy.get(s.id) ?? false,
  }));
}

export function useSupplementsToday() {
  return useQuery({
    queryKey: [...queryKeys.supplements, todayStr()],
    queryFn: fetchSupplementsToday,
    staleTime: 60_000,
  });
}

export function useToggleSupplement() {
  const qc = useQueryClient();
  const date = todayStr();
  const key = [...queryKeys.supplements, date];

  return useMutation({
    mutationFn: async (vars: { id: string; taken: boolean }) => {
      const userId = await requireUserId();
      // supplement_logs has UNIQUE(supplement_id, log_date) → true upsert.
      const { error } = await db()
        .from("supplement_logs")
        .upsert(
          { user_id: userId, supplement_id: vars.id, log_date: date, taken: vars.taken },
          { onConflict: "supplement_id,log_date" }
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<SupplementWithStatus[]>(key);
      if (prev) {
        qc.setQueryData<SupplementWithStatus[]>(
          key,
          prev.map((s) => (s.id === vars.id ? { ...s, taken: vars.taken } : s))
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(`Couldn't update supplement: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
