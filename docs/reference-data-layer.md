# Data-layer reference

Complete public surface of `src/lib/data/*`, the Supabase schema, server
routes, and environment. For design rationale, see
[architecture.md](architecture.md).

## Conventions

Every module follows the same shape (copied from `mood-logs.ts`):

- `fetch*` — plain async function hitting Supabase through `db()`.
- `use*Sync` / `useToday*` — `useQuery` + effect hydrating the Zustand store.
- `use*` mutations — optimistic store/cache update → Supabase → rollback +
  `toast.error` on failure, `toast.success` on success, invalidate on settle.
- Reads rely on RLS; mutations call `requireUserId()` (throws when signed out).
- `todayStr()` (`mood-logs.ts`) returns local `yyyy-MM-dd` — the shared
  day-boundary definition.

## Hooks by module

### profile.ts

| Export | Kind | Notes |
|---|---|---|
| `fetchProfile()` | query fn | `.maybeSingle()` — `null` means "needs onboarding" |
| `useProfileSync()` | hook | refetch entry point (Gate already hydrates for routing) |
| `useUpsertProfile()` | mutation | `{...ProfileData, markOnboarded?}`; upserts on `profiles.id` |

### cycle-logs.ts

| Export | Kind | Notes |
|---|---|---|
| `fetchCycleLogs()` | query fn | returns `Record<date, CycleLog>` (all rows, RLS-scoped) |
| `useCycleLogsSync()` | hook | hydrates `store.cycleLogs`; call once per view |
| `useUpsertCycleLog()` | mutation | `{date, log}`; merges over existing, `flow` forced `"medium"` default / nulled when not a period day; upsert on `(user_id, log_date)` |
| `useDeleteCycleLog()` | mutation | `(date)` |

### mood-logs.ts

| Export | Kind | Notes |
|---|---|---|
| `todayStr()` | util | shared "today" for all daily modules |
| `fetchMoodLog(date)` | query fn | `.maybeSingle()` → `MoodLog \| null` |
| `useTodayMoodLog()` | hook | `[...moodLogs, today]`; `staleTime` 60s |
| `useUpsertMoodLog()` | mutation | `Partial<MoodLog>`; emulates upsert via select-then-write (no unique constraint on `mood_logs`) |

### habits.ts (quantitative: water ml, sleep hours)

| Export | Kind | Notes |
|---|---|---|
| `useHabitValue(name)` | hook | today's `habit_logs.value` for the named habit; `null` when unlogged |
| `useSetHabitValue(name)` | mutation | `(value)`; auto-creates the `habits` row on first use (race-safe re-read); upserts on `(habit_id, log_date)`; sets `done = value > 0` |

Habit names in use: `"Water"`. Sleep is display-only (no setter wired).

### supplements.ts

| Export | Kind | Notes |
|---|---|---|
| `fetchSupplementsToday()` | query fn | seeds 4 defaults (Folic Acid, D3, Magnesium Glycinate, Omega 3) when the user has zero supplements — the dashboard has no add-UI |
| `useSupplementsToday()` | hook | `SupplementWithStatus[]` (`taken` from today's logs) |
| `useToggleSupplement()` | mutation | `{id, taken}`; true upsert on `(supplement_id, log_date)` |

### journal.ts

| Export | Kind | Notes |
|---|---|---|
| `fetchJournalEntries()` | query fn | newest-first; TipTap JSON in `content_json`, preview in `plain_text` |
| `useJournalEntriesSync()` | hook | hydrates `store.journalEntries` |
| `useAddJournalEntry()` | mutation | client-generated `id` + `createdAt`; stamps `mood` + `cyclePhase` |
| `useUpdateJournalEntry()` | mutation | `{id, contentJSON, contentText, mood?}` |
| `useDeleteJournalEntry()` | mutation | `(id)` |

### reminders.ts

| Export | Kind | Notes |
|---|---|---|
| `fetchReminders()` / `useRemindersSync()` / `useUpdateReminders()` | as above | DB columns are `period_reminder`/`log_nudge`/`supplement_reminder`/`reminder_time` (`HH:MM:SS`); `enabled` is client-only, derived as "any sub-toggle on" |

### chat.ts

| Export | Kind | Notes |
|---|---|---|
| `useChatHistory("sakhi" \| "maya")` | hook | messages of the latest session, oldest-first; `[]` when signed out or on any failure; `staleTime: Infinity, gcTime: 0` (load once) |

### dev-seed.ts

| Export | Kind | Notes |
|---|---|---|
| `DEV_SEED_ENABLED` | const | `NEXT_PUBLIC_ENABLE_DEV_SEED === "true"` |
| `useDevSeed()` | hook | inserts 30 days of cycle logs + 2 journal entries once, only when the user has zero logs; mounted by `DashboardView` |

### keys.ts

```ts
profile, cycleLogs, moodLogs, habits, habitLogs(date),
supplements, supplementLogs(date), journalEntries, reminders,
chatSessions(persona), chatMessages(sessionId)
```

## Supabase clients

| File | Scope | Use for |
|---|---|---|
| `lib/supabase/client.ts` `createClient()` | browser | all `lib/data/*` reads/writes (RLS applies) |
| `lib/supabase/server.ts` `createClient()` | server | chat route auth + RLS-scoped writes (cookie session) |
| `lib/supabase/admin.ts` `createAdminClient()` | server only | health checks; `import "server-only"` fails the build if bundled client-side |

## HTTP surface

| Route | Method | Body | Responses |
|---|---|---|---|
| `/api/health` | GET | — | `{ok, connectivity, core: {missing[]}, rag: {missing[]}}`; 503 when core tables missing (probe via `PGRST205`) |
| `/api/chat/[persona]` | POST | `{messages: [{role: "user"\|"assistant", content}]}` ≤40 msgs / 8000 chars | `{reply}`; 400 bad persona/body, 401 signed out, 500 save failure, 502 NIM failure |
| `/auth/callback` | GET | `?code=&next=` | exchanges code → session cookie → redirect; else `/auth/auth-code-error` |

`middleware.ts` refreshes the session on every non-static request.

## Schema (`supabase/migrations/`)

- **0001** — `profiles` (id = auth user id, `onboarded` flag), `reminder_preferences`, `cycle_logs` (unique `(user_id, log_date)`), `mood_logs`, `habits` + `habit_logs` (unique `(habit_id, log_date)`), `supplements` + `supplement_logs` (unique `(supplement_id, log_date)`), `journal_entries`, `chat_sessions` + `chat_messages`. All RLS `auth.uid() = user_id`, full self-access.
- **0002** — `documents`, `document_chunks` (`embedding vector(2048)`), authenticated-read-only RLS, `match_document_chunks(vector, count)` RPC returning `(id, content, similarity)`. No vector index (see architecture.md).
- **0003** — `habit_logs.value numeric` for quantitative metrics.

Hand-maintained TS mirrors live in `lib/data/database.types.ts` (regenerate
via `supabase gen types` once the CLI is linked).

## Environment

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | RLS-scoped data access |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | health probes, ingestion (bypasses RLS) |
| `NVIDIA_NIM_API_KEY` | server only | chat + embeddings |
| `NVIDIA_NIM_MODEL` | server only | optional chat model override (default `nvidia/llama-3.3-nemotron-super-49b-v1.5`) |
| `NEXT_PUBLIC_ENABLE_DEV_SEED` | client | `"true"` enables mock seeding for new users |

Template: `.env.example`. Never commit `.env.local`.
