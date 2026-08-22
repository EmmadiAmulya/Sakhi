"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import { db, requireUserId } from "./client";
import { queryKeys } from "./keys";
import { useProfileStore, type JournalEntry } from "@/lib/store/profile";
import { toast } from "@/lib/toast";
import type { JournalEntryRow } from "./database.types";

function rowToEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    contentJSON: (row.content_json ?? { type: "doc", content: [] }) as JSONContent,
    contentText: row.plain_text ?? "",
    mood: row.mood ?? undefined,
    cyclePhase: row.cycle_phase ?? "",
  };
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await db()
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as JournalEntryRow[] | null)?.map(rowToEntry) ?? [];
}

export function useJournalEntriesSync() {
  const query = useQuery({
    queryKey: queryKeys.journalEntries,
    queryFn: fetchJournalEntries,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      useProfileStore.setState({ journalEntries: query.data });
    }
  }, [query.data]);

  return query;
}

export function useAddJournalEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      createdAt: string;
      contentJSON: JSONContent;
      contentText: string;
      mood?: string;
      cyclePhase: string;
    }) => {
      const userId = await requireUserId();
      const { error } = await db().from("journal_entries").insert({
        id: input.id,
        user_id: userId,
        content_json: input.contentJSON,
        plain_text: input.contentText,
        mood: input.mood ?? null,
        cycle_phase: input.cyclePhase || null,
        created_at: input.createdAt,
      });
      if (error) throw new Error(error.message);
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.journalEntries });
      const prev = useProfileStore.getState().journalEntries;
      const entry: JournalEntry = {
        id: input.id,
        createdAt: input.createdAt,
        contentJSON: input.contentJSON,
        contentText: input.contentText,
        mood: input.mood,
        cyclePhase: input.cyclePhase,
      };
      useProfileStore.setState({ journalEntries: [entry, ...prev] });
      return { prev };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.prev) useProfileStore.setState({ journalEntries: ctx.prev });
      toast.error(`Couldn't save entry: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.journalEntries });
    },
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      contentJSON: JSONContent;
      contentText: string;
      mood?: string;
    }) => {
      const userId = await requireUserId();
      const { error } = await db()
        .from("journal_entries")
        .update({
          content_json: input.contentJSON,
          plain_text: input.contentText,
          mood: input.mood ?? null,
        })
        .eq("id", input.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.journalEntries });
      const prev = useProfileStore.getState().journalEntries;
      useProfileStore.setState({
        journalEntries: prev.map((e) =>
          e.id === input.id
            ? {
                ...e,
                contentJSON: input.contentJSON,
                contentText: input.contentText,
                ...(input.mood ? { mood: input.mood } : {}),
              }
            : e
        ),
      });
      return { prev };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.prev) useProfileStore.setState({ journalEntries: ctx.prev });
      toast.error(`Couldn't update entry: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.journalEntries });
    },
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await requireUserId();
      const { error } = await db()
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.journalEntries });
      const prev = useProfileStore.getState().journalEntries;
      useProfileStore.setState({ journalEntries: prev.filter((e) => e.id !== id) });
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) useProfileStore.setState({ journalEntries: ctx.prev });
      toast.error(`Couldn't delete entry: ${err instanceof Error ? err.message : "unknown error"}`);
    },
    onSuccess: () => {
      toast.success("Entry deleted");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.journalEntries });
    },
  });
}
