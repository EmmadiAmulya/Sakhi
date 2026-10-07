"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { useProfileStore, type ProfileData } from "@/lib/store/profile";
import { toast } from "@/lib/toast";
import type { ProfileRow } from "./database.types";

function rowToProfile(row: ProfileRow): ProfileData {
  return {
    name: row.name ?? "",
    age: row.age,
    height: row.height_cm != null ? Number(row.height_cm) : null,
    weight: row.weight_kg != null ? Number(row.weight_kg) : null,
    cycleLength: row.cycle_length ?? 28,
    lastPeriodDate: row.last_period_date ?? null,
  };
}

export async function fetchProfile(): Promise<{ profile: ProfileData; onboarded: boolean } | null> {
  // .maybeSingle(): a missing profile row is a valid "needs onboarding" state.
  const { data, error } = await db().from("profiles").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as ProfileRow;
  return { profile: rowToProfile(row), onboarded: Boolean(row.onboarded) };
}

/** Hydrate the profile store from Supabase. Gate does this for routing too; this
 *  is available for views that want a fresh refetch (e.g. after edit). */
export function useProfileSync() {
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      useProfileStore.setState({
        profile: query.data.profile,
        isOnboarded: query.data.onboarded,
      });
    }
  }, [query.data]);

  return query;
}

export interface UpsertProfileVars extends ProfileData {
  /** When true, marks the profile as onboarded (first-run completion). */
  markOnboarded?: boolean;
}

export function useUpsertProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: UpsertProfileVars) => {
      const userId = await requireUserId();
      const { error } = await db()
        .from("profiles")
        .upsert(
          {
            id: userId,
            name: vars.name,
            age: vars.age,
            height_cm: vars.height,
            weight_kg: vars.weight,
            cycle_length: vars.cycleLength,
            last_period_date: vars.lastPeriodDate || null,
            ...(vars.markOnboarded ? { onboarded: true } : {}),
          },
          { onConflict: "id" }
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile });
      const prevProfile = useProfileStore.getState().profile;
      const prevOnboarded = useProfileStore.getState().isOnboarded;
      useProfileStore.setState({
        profile: {
          name: vars.name,
          age: vars.age,
          height: vars.height,
          weight: vars.weight,
          cycleLength: vars.cycleLength,
          lastPeriodDate: vars.lastPeriodDate,
        },
        ...(vars.markOnboarded ? { isOnboarded: true } : {}),
      });
      return { prevProfile, prevOnboarded };
    },
    onError: (err, _vars, ctx) => {
      if (ctx) {
        useProfileStore.setState({
          profile: ctx.prevProfile,
          isOnboarded: ctx.prevOnboarded,
        });
      }
      toast.error(`Couldn't save your profile: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      toast.success("Profile saved");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
