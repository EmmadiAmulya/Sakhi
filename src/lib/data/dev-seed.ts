"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { mockCycleLogs, mockJournalEntries } from "@/lib/mock-data";

/**
 * Dev-only mock seeding, gated behind NEXT_PUBLIC_ENABLE_DEV_SEED=true.
 * Never runs in production builds unless the flag is explicitly set. Idempotent:
 * only seeds when the user currently has zero cycle logs.
 */
export const DEV_SEED_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEV_SEED === "true";

async function seedDevData(): Promise<boolean> {
  const userId = await requireUserId();

  const { count, error: countErr } = await db()
    .from("cycle_logs")
    .select("id", { count: "exact", head: true });
  if (countErr) throw new Error(countErr.message);
  if ((count ?? 0) > 0) return false; // already has data — do nothing

  const cycleRows = Object.values(mockCycleLogs).map((l) => ({
    user_id: userId,
    log_date: l.date,
    is_period: l.isPeriod,
    flow: l.isPeriod ? l.flow ?? "medium" : null,
    symptoms: l.symptoms ?? [],
    mood: l.mood ?? null,
    energy: l.energy ?? null,
    note: l.note ?? null,
  }));
  const { error: cErr } = await db()
    .from("cycle_logs")
    .upsert(cycleRows, { onConflict: "user_id,log_date" });
  if (cErr) throw new Error(cErr.message);

  const journalRows = mockJournalEntries.map((e) => ({
    user_id: userId,
    content_json: e.contentJSON,
    plain_text: e.contentText,
    mood: e.mood ?? null,
    cycle_phase: e.cyclePhase ?? null,
    created_at: e.createdAt,
  }));
  const { error: jErr } = await db().from("journal_entries").insert(journalRows);
  if (jErr) throw new Error(jErr.message);

  return true;
}

/** Runs the dev seed once per mount when the flag is enabled. No-op otherwise. */
export function useDevSeed() {
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!DEV_SEED_ENABLED || ran.current) return;
    ran.current = true;
    seedDevData()
      .then((seeded) => {
        if (seeded) {
          qc.invalidateQueries({ queryKey: queryKeys.cycleLogs });
          qc.invalidateQueries({ queryKey: queryKeys.journalEntries });
          console.info("[dev-seed] Seeded mock cycle logs + journal entries.");
        }
      })
      .catch((err) => {
        console.error("[dev-seed] Failed:", err);
      });
  }, [qc]);
}
