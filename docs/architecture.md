# Architecture

How Sakhi fits together and why. For exact APIs, see [reference-data-layer.md](reference-data-layer.md); for operations, see [howto-operate.md](howto-operate.md).

## The big picture

Sakhi is a single-page tab app (Next.js App Router, one route `/`) with two
strictly separated data paths:

```
USER DATA  browser ──► Supabase Postgres (RLS) ──► browser
           direct, no server middleman. Key in browser is the anon key.

AI         browser ──► /api/chat/[persona] ──► NVIDIA NIM ──► browser
           proxied. The NIM key never leaves the server.
```

The split exists for one reason: the NIM key is a secret, so anything touching
it runs in a Next.js server route. Everything else goes straight to Supabase,
where Row-Level Security (`auth.uid() = user_id` on every user table) is the
enforcement point — there is no server-side authorization code to maintain.

## Request flow: opening the app

```
page.tsx → Gate → AppShell → one of 6 views (AnimatePresence transitions)
```

- **Middleware** (`src/middleware.ts`) refreshes the Supabase session on every
  request (all paths except static assets).
- **Login** is passwordless: `signInWithOtp` sends a magic link;
  `/auth/callback` exchanges the code for a session, else redirects to
  `/auth/auth-code-error`.
- **Gate** (`components/auth/Gate.tsx`) routes session → profile →
  `LoginView` | `OnboardingForm` | app. It fetches only the profile row for
  routing; every view lazy-loads its own data. Two hard-won rules live here:
  never `await` inside the `onAuthStateChange` callback (trips supabase-js's
  internal auth lock and hangs the app), and surface raw Supabase errors
  (e.g. PGRST205 = migration not applied) so the fix is obvious.
- **Onboarding** (`OnboardingForm`, react-hook-form + zod) collects name, age,
  height, weight, cycle length, last period date, then `useUpsertProfile`
  marks `profiles.onboarded = true`. Settings reuses the same form in edit mode.

## State: store is a cache, queries own the truth

```
TanStack Query (server state) ──sync──► Zustand persist store (read cache)
                                        ▲ views read from here
Mutations: optimistic store update → Supabase → rollback + toast on error
```

- `src/lib/data/*` hooks own all persistence. Views never write to Supabase or
  the store directly.
- The Zustand store (`lib/store/profile.ts`) is `persist`ed to localStorage so
  first paint has data; `use*Sync` hooks hydrate it from Supabase.
- QueryClient defaults: no refetch on window focus, 1 retry.
- One deliberate exception: `useChatHistory` (`lib/data/chat.ts`) reads
  directly into components — chat messages live only in the current session
  and are composed as `history + new messages` via `useMemo` (never
  setState-in-effect; the lint rule forbids it).

## AI chat: `/api/chat/[persona]`

`src/app/api/chat/[persona]/route.ts` (Node runtime):

1. Reject unknown persona (400). Require `NVIDIA_NIM_API_KEY` (500 if unset).
2. Authenticate via the RLS-scoped server client; 401 when signed out.
3. Validate body: `{messages: [{role: "user"|"assistant", content}]}`,
   max 40 messages, 8000 chars each (trust boundary).
4. Find-or-create the user's latest `chat_sessions` row for the persona;
   persist the newest user message.
5. Call NIM's OpenAI-compatible endpoint with the persona's `systemPrompt`
   from `lib/personas.ts` (+ RAG context for Maya, below). Model defaults to
   `nvidia/llama-3.3-nemotron-super-49b-v1.5`, overridable via
   `NVIDIA_NIM_MODEL`. `max_tokens: 2048` (1024 truncated Maya's grounded answers).
6. Persist the assistant reply; return `{reply}`. A failed reply-save still
   returns the text rather than losing it.

Both chat views replaced keyword-regex mock replies with this route. The
system prompts carry the product's safety design: Sakhi validates emotion and
hands medical questions to Maya; Maya appends a disclaimer and escalates
red-flag symptoms to helplines (`PERSONAS.maya.helplines`).

## RAG grounding for Maya

- **Schema** (`0002_rag.sql`): `documents` + `document_chunks` with
  `embedding vector(2048)` = `nvidia/nemotron-3-embed-1b`, RLS read-only to
  authenticated users, and a `match_document_chunks(vector, count)` RPC.
  There is deliberately **no ANN index**: pgvector caps indexes at 2000 dims
  and ~100 chunks scan exactly in microseconds with perfect recall. Revisit
  past ~5k chunks (then truncate embeddings + index).
- **Ingestion** (`scripts/ingest.mjs`, run once from repo root): chunks the 7
  KB markdown docs on headings (≤1500 chars), embeds with `input_type:
  "passage"`, upserts idempotently per document title via the service-role
  key, then self-checks retrieval (fails below 0.3 similarity).
- **Retrieval** (inside the chat route, Maya only): embed the query with
  `input_type: "query"` → top-5 chunks → appended to Maya's system prompt
  with cite-or-disclaim instructions. Any failure degrades silently to
  ungrounded chat. Sakhi never retrieves (safety design: pure companion).

## Cycle math: `lib/cycle.ts`

Pure functions, no I/O, shared by calendar, journal stamps, dashboard, trends:

- `refineCycleMetrics(logs, defaults)` — finds period runs (≤1.5-day gaps),
  averages run length and inter-run gaps, rejects outlier cycles outside
  15–50 days, clamps to 21–40 / 3–10.
- `calculateCycle(lastPeriod, cycleLen, periodLen, date)` — modular cycle day,
  fertile window (5 days pre-ovulation + ovulation day), predicted period
  window, phase via `getCyclePhaseForDay`, whose boundaries scale with cycle
  length (`ovulation ≈ max(period+3, length−14)`).
- Phase copy lives in `lib/phase-content.ts` (focus/energy/nutrition/exercise/
  self-care per phase), rendered by `PhaseInsightCard`.

## Design system

Glassmorphism primitives (`GlassCard`/`GlassPanel`/`GlassButton`) over
semantic Tailwind v4 tokens (`sakura-deep #d56f96`, `plum #8a5a78`,
`ink-text/ink-soft`, `surface-*`) defined in `globals.css`; Noto Serif JP +
Quicksand; shared `pageVariants`/`itemVariants` in `lib/motion.ts`;
atmosphere via `AppBackground` + falling-petal `PetalField`; macOS-style
magnifying dock (`Dock` + `DockNav`, 6 tabs); Lenis smooth scroll with a
`prefers-reduced-motion` guard. Heavy components (TipTap editor, Recharts)
are `next/dynamic` with `ssr: false`.

## PWA + housekeeping

Installability via native `app/manifest.ts`, GDI-generated icons, and a
passthrough `public/sw.js` (no offline cache — add precaching when offline
use becomes a requirement). CI runs lint + typecheck on push to `Dev`/`main`.

## What's intentionally missing

Push notification delivery (prefs UI exists; nothing sends), sleep logging
(display-only), Maya's rich emergency-helpline card renderer (unreachable
since mock replies were removed), chat streaming, offline cache.
