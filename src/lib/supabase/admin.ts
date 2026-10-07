import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase client. SERVER ONLY.
 *
 * The `import "server-only"` above is a hard guard: if any client component
 * (or anything in the client bundle) transitively imports this file, the build
 * fails instead of silently shipping the service-role key to the browser.
 *
 * Uses the service-role key, which BYPASSES Row-Level Security. Only use this
 * for trusted server work: health checks, the RAG ingestion pipeline, and
 * future cron/push jobs. Never expose its results directly to an unauthenticated
 * caller without your own authorization checks.
 */
let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is required for admin/server tasks (health check, ingestion)."
    );
  }

  if (cached) return cached;

  cached = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}
