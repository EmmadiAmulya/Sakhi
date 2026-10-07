import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared browser Supabase client for the data layer. All user data flows
 * directly browser → Postgres, protected by Row-Level Security (auth.uid()).
 */
let browserClient: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

/**
 * Returns the current authenticated user id, or throws. Mutations need the id
 * for `user_id` columns; reads rely on RLS so they don't strictly need it.
 */
export async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await db().auth.getUser();
  if (error) throw new Error(error.message);
  if (!user) throw new Error("You are not signed in.");
  return user.id;
}
