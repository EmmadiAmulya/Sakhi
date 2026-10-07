import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Server-side health check. Confirms:
 *  1. Supabase connectivity (can we reach the project at all?)
 *  2. That every expected table exists.
 *
 * Implementation note: Supabase's PostgREST does not expose the
 * `information_schema` over the data API, so we verify table presence by
 * probing each table with the service-role client (which bypasses RLS). A
 * missing table returns PostgREST error `PGRST205` ("Could not find the table
 * ... in the schema cache"); an existing-but-empty table returns `[]`. This is
 * a reliable existence check without needing a custom SQL function.
 *
 * If core tables are missing, the migration has not been applied — the response
 * says exactly that so the operator knows to run `supabase/migrations/*.sql`.
 */

// Tables created by 0001_init.sql
const CORE_TABLES = [
  "profiles",
  "reminder_preferences",
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

// Tables created by 0002_rag.sql (RAG / Maya grounding)
const RAG_TABLES = ["documents", "document_chunks"] as const;

type ProbeResult = { table: string; present: boolean; error?: string };

async function probeTable(
  admin: ReturnType<typeof createAdminClient>,
  table: string
): Promise<ProbeResult> {
  const { error } = await admin.from(table).select("*", { head: true, count: "exact" }).limit(1);

  if (!error) return { table, present: true };

  const code = (error as { code?: string }).code ?? "";
  const message = error.message ?? "";
  const missing =
    code === "PGRST205" ||
    /schema cache/i.test(message) ||
    /does not exist/i.test(message) ||
    /could not find the table/i.test(message);

  return { table, present: !missing, error: `${code} ${message}`.trim() };
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    // Missing env vars — misconfiguration, not a DB outage.
    return NextResponse.json(
      {
        ok: false,
        connectivity: "misconfigured",
        checkedAt,
        error: err instanceof Error ? err.message : "Server is misconfigured.",
        hint: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment.",
      },
      { status: 500 }
    );
  }

  let results: ProbeResult[];
  try {
    results = await Promise.all(
      [...CORE_TABLES, ...RAG_TABLES].map((t) => probeTable(admin, t))
    );
  } catch (err) {
    // A thrown (rather than returned) error means we could not reach Supabase.
    return NextResponse.json(
      {
        ok: false,
        connectivity: "unreachable",
        checkedAt,
        error: err instanceof Error ? err.message : "Could not reach Supabase.",
      },
      { status: 503 }
    );
  }

  const byName = new Map(results.map((r) => [r.table, r]));
  const missingCore = CORE_TABLES.filter((t) => !byName.get(t)?.present);
  const missingRag = RAG_TABLES.filter((t) => !byName.get(t)?.present);
  const connErrors = results.filter(
    (r) => !r.present && r.error && !/PGRST205|schema cache|does not exist|could not find the table/i.test(r.error)
  );

  // If probes returned connectivity-style errors (not "table missing"), the DB
  // is unreachable/misconfigured rather than just un-migrated.
  if (connErrors.length > 0 && missingCore.length === CORE_TABLES.length) {
    return NextResponse.json(
      {
        ok: false,
        connectivity: "error",
        checkedAt,
        error: connErrors[0].error,
        hint: "Check NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY and that the project is running.",
      },
      { status: 503 }
    );
  }

  const coreOk = missingCore.length === 0;
  const ragOk = missingRag.length === 0;

  return NextResponse.json(
    {
      ok: coreOk,
      connectivity: "ok",
      checkedAt,
      core: {
        ok: coreOk,
        missing: missingCore,
        hint: coreOk
          ? undefined
          : "Core tables are missing. Apply supabase/migrations/0001_init.sql (Supabase SQL editor or `supabase db push`).",
      },
      rag: {
        ok: ragOk,
        missing: missingRag,
        hint: ragOk
          ? undefined
          : "RAG tables are missing. Apply supabase/migrations/0002_rag.sql, then run the ingestion script.",
      },
    },
    { status: coreOk ? 200 : 503 }
  );
}
