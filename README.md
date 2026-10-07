# Sakhi — Women's Health Companion

[![CI](https://github.com/EmmadiAmulya/Sakhi/actions/workflows/ci.yml/badge.svg?branch=Dev)](https://github.com/EmmadiAmulya/Sakhi/actions/workflows/ci.yml)

A privacy-first, sakura-themed PWA for menstrual-cycle tracking, mood/habit logging, journaling, and two AI companions:

- **Sakhi 🌸** — empathetic emotional support (warm, non-clinical, low reasoning effort)
- **Maya 🩺** — evidence-based health guide, grounded (RAG) in a peer-reviewed women's-health knowledge base, with disclaimers and emergency helplines

> Sakhi is an educational wellness companion, not a medical device. It never diagnoses; predictions are estimates and crisis language escalates to real helplines.

---

## Feature tour

### Cycle tracking
- `react-day-picker` calendar with distinct modifiers: logged period, predicted period, high-fertility window, estimated ovulation, symptom/note dots.
- Day detail sheet: period toggle, flow intensity (spotting→heavy), symptoms, mood (10 stable ids), energy 1–5, note.
- Cycle metrics are **refined from your own history** (`refineCycleMetrics`): finds period runs (≤1.5-day gaps), averages run length and inter-run gaps, rejects outlier cycles outside 15–50 days, clamps to 21–40 / 3–10.
- Phase insight cards (focus / energy / nutrition / exercise / self-care) per phase from `lib/phase-content.ts`.
- No fabricated data: without a last-period date the UI asks you to set one instead of inventing day/phase numbers.

### Dashboard
- Cycle progress ring + phase-aware hero copy.
- **Water** (ml, +250 steps) and **Sleep** (hours, ±0.5 steps) — real persisted metrics stored as `habit_logs.value`, auto-creating their `habits` rows (unique `(user_id, name)`).
- Daily mood (all 10 moods), supplement checklist (4 defaults seeded on first load), quick journal note.

### Journal
- TipTap rich-text editor (bold/italic/H2/H3/lists/quotes) with **debounced autosave** (1s), stable draft ids (no duplicate inserts), flush on unmount/tab-hide, and a real Saving…/Saved chip.
- Entries are stamped with the current cycle phase **id** (`menstrual`/`follicular`/`ovulatory`/`luteal`) and an optional mood; the timeline shows mood + phase chips and hover/touch-reachable delete.
- Only the assistant's final answer is persisted for chats; journal thinking is never stored.

### Wellness trends
- Recharts visualizations for mood-by-phase, energy curves, symptom frequency, plus averages (cycle length, period duration, total days logged). Needs ≥3 logs before charts render.

### Two AI companions
- Streaming SSE replies with **live thinking text** while the model reasons, then the answer.
- Safety design: Sakhi validates emotion and hands medical questions to Maya; Maya appends a disclaimer, and an emergency regex on the user's message surfaces a helpline directory (India / US / UK).
- Model is **per persona** (`lib/personas.ts`): NVIDIA NIM `nvidia/nemotron-3-ultra-550b-a55b`, with `NVIDIA_NIM_MODEL` global override and a one-shot fallback model on NIM 5xx/overload.
- Reasoning effort is per persona (Sakhi `low`, Maya `high`), env-overridable; NIM accepts only `low` / `high` / `max`.

### Reminders & alerts
- Per-category toggles (period predictions, daily log nudge, supplement alarm) plus a **persisted master switch** (migration `0006`) and delivery time.
- Honest limitation: notifications fire while the app is open in a browser tab; background push is future work.

### Data control
- **Export** a full JSON backup of every user table; **import** restores idempotently with id remapping (one commit per table, errors reported).
- **Reset Profile & Logout** deletes all rows for the user, then signs out.
- A **feedback form** link lives in Settings → Data Operations.
- Row-Level Security everywhere; the on-device cache persists only non-sensitive UI state.

### Auth & onboarding
- Supabase magic-link auth (`/auth/callback` exchanges the code), session refresh in `src/middleware.ts`, a routing gate (session → profile → onboarding → app), and profile editing in Settings.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js `16.2.9` (App Router, Turbopack), React `19.2.4` |
| Styling | Tailwind CSS v4, custom glassmorphism tokens, `framer-motion` |
| Data | Supabase (Postgres + RLS + Auth) via `@supabase/ssr` / `supabase-js` |
| Server state | TanStack Query v5 (queries own the truth) |
| Client cache | Zustand v5 (persist partialized) |
| Editor | Tiptap 3 (`@tiptap/react` + StarterKit) |
| Charts | Recharts 3 |
| Calendar | react-day-picker 10 |
| AI | NVIDIA NIM chat completions (OpenAI-compatible, SSE), `nvidia/nemotron-3-ultra-550b-a55b` |
| Embeddings | `nvidia/nemotron-3-embed-1b` (2048-dim, pgvector) |
| Scroll | Lenis (with `prefers-reduced-motion` guard) |
| Tests | `node:test` (`--experimental-strip-types`) |
| CI | GitHub Actions: lint + typecheck on push to `Dev`/`main` |

---

## Architecture

```
                       ┌──────────────────────────── browser ───────────────────────────┐
                       │  Next.js App Router (client components)                        │
                       │                                                                │
   user data ──────────┼──► src/lib/data/*  (TanStack Query hooks, optimistic updates)  │
                       │         │                                                      │
                       │         ▼                                                      │
                       │    Supabase JS  ── RLS: auth.uid() = user_id ──►  Postgres     │
                       │         ▲                                                      │
                       │  Zustand store (read cache, partialized persistence)           │
                       │                                                                │
   AI chat ────────────┼──► POST /api/chat/[persona]  (server route, Node runtime)      │
                       │         │  auth via cookie session; persists messages          │
                       │         ▼                                                      │
                       │    NVIDIA NIM  ── SSE ──► meta / thinking / delta / error / done
                       └────────────────────────────────────────────────────────────────┘
```

### Privacy model
- The browser talks **directly to Supabase** for user data; every table has RLS scoped to `auth.uid()`. There is no application server in the data path.
- `SUPABASE_SERVICE_ROLE_KEY` is used only server-side (`src/lib/supabase/admin.ts`, guarded by `import "server-only"`) for the health probe and the ingestion script, where RLS would otherwise block cross-user reads.
- No analytics/telemetry. The chat API key (`NVIDIA_NIM_API_KEY`) never reaches the client.

### AI chat pipeline — `/api/chat/[persona]`
1. Reject unknown persona (400); require `NVIDIA_NIM_API_KEY` (500 if unset).
2. Authenticate with the RLS-scoped server client (401 when signed out).
3. Validate body at the trust boundary: ≤40 messages, ≤8000 chars each, optional preserved `reasoning_content` (≤32k chars).
4. Find/create the user's latest `chat_sessions` row per persona; persist the newest user message.
5. Call NIM (`max_tokens: 32768`, `temperature: 1`, `seed: 0`, `stream: true`) with the persona `systemPrompt` (+ RAG context for Maya). Per-persona model/effort; **one retry on a fallback model** if NIM returns 5xx/overload; 45s upstream inactivity watchdog; `maxDuration = 300`.
6. Stream SSE to the client: `meta` (emergency flag), `thinking` (model `reasoning_content`), `delta` (answer text), `error`, `done`. The final answer is persisted once the stream ends.
7. Client (`usePersonaChat`) accumulates thinking/answer per message, sends prior `reasoning_content` back for preserved thinking, drops empty placeholders, and has a 90s stall backstop.

### RAG grounding for Maya
- Schema (`0002_rag.sql`): `documents` + `document_chunks(embedding vector(2048))`, authenticated read-only RLS, and `match_document_chunks(query_embedding, count)` returning `(id, content, similarity)`.
- **No ANN index by design:** pgvector caps indexes at 2000 dims and a corpus of tens/hundreds of chunks scans exactly in microseconds with perfect recall. Revisit past ~5k chunks (truncate to 1024 dims + ivfflat/hnsw).
- Retrieval (Maya only): embed the query with `input_type: "query"` → top-5 chunks → appended to the system prompt as `REFERENCE CONTEXT`. Any retrieval failure degrades gracefully (no context, chat still works).
- Ingestion (`scripts/ingest.mjs`): chunks KB markdown on headings (≤1500 chars), embeds with `input_type: "passage"` via `nvidia/nemotron-3-embed-1b`, upserts idempotently per document title with the service-role key, then self-checks retrieval (fails below 0.3 similarity).

### Cycle math (`src/lib/cycle.ts`)
Pure functions shared by calendar, dashboard, journal, trends:
- `refineCycleMetrics(logs, defaults)` — history-derived cycle/period lengths with outlier rejection and clamping.
- `calculateCycle(lastPeriod, cycleLen, periodLen, date)` — modular cycle day, ovulation ≈ `max(period+3, length−14)`, fertile window (5 days pre-ovulation + ovulation day), predicted period window, phase from `getCyclePhaseForDay`.
- `getPhaseName(id)` maps stored phase ids back to display names (legacy display-name rows pass through).

### Data layer (`src/lib/data/*`)
Every module follows the same shape: `fetch*` plain async functions, `use*` query hooks that hydrate the Zustand cache, mutations with optimistic updates → rollback + toast on failure, `requireUserId()` for writes, RLS for reads. Full reference: [`docs/reference-data-layer.md`](docs/reference-data-layer.md).

---

## Research & knowledge base

Maya's answers are grounded in a curated corpus under `docs/`, ingested into pgvector:

- **`docs/womens_health_kb_rag.md`** — the RAG-optimized reference: menstruation & cycle disorders (dysmenorrhea mechanisms, prostaglandins, evidence-based supplements/dosages), PMS/PMDD (allopregnanolone–GABA-A paradox), PCOS & metabolic hormonal imbalances (inositol ratios, insulin resistance), thyroid/cortisol crosstalk, nutritional deficiencies, biochemical feedback loops.
- **`docs/womens_daily_health_research.md`** — the everyday-relief companion: core health domains, an interconnection matrix, supplement/action protocol, lifestyle guidelines.
- **`docs/research/vertical_1_menstrual_health.md`** — endocrine rhythm: the four phases' hormonal architecture, PCOS (insulin–inositol axis), PMDD (neurosteroid dysregulation), the cortisol "progesterone steal".
- **`docs/research/vertical_2_mental_health.md`** — GAD/HPA-axis dysregulation, panic as a somatic cascade, targeted supplementation (L-theanine, ashwagandha, lemon balm) with dependency/hormonal caveats.
- **`docs/research/vertical_3_micronutrients.md`** — iron deficiency anemia in young women (absorption synergies/blockers, iron forms), vitamin D3 + K2, B12 forms, magnesium bioavailability.
- **`docs/research/vertical_4_mood_neurochemical.md`** — estrogen–serotonin dynamics and the luteal crash, brain fog mechanisms, nootropics/adaptogens with serotonin-syndrome and sleep caveats.
- **`docs/research/vertical_5_interdependencies_matrix.md`** — the cross-vertical cascades (stress → progesterone disruption → estrogen dominance; iron deficiency → brain fog; D3 → serotonin; stress → magnesium depletion) and strategic intervention priorities.

Product/spec documents live alongside: PRD, feature specs, AI prompt & safety design, and the data model & RLS schema — see the [documentation index](#documentation).

---

## Data model & migrations

`supabase/migrations/*.sql`, applied in order via the Supabase SQL editor (see [`docs/howto-operate.md`](docs/howto-operate.md)):

| # | Contents |
|---|---|
| `0001` | Core schema + RLS: `profiles`, `reminder_preferences`, `cycle_logs` (unique `(user_id, log_date)`), `mood_logs`, `habits` + `habit_logs` (unique `(habit_id, log_date)`), `supplements` + `supplement_logs`, `journal_entries`, `chat_sessions` + `chat_messages`; `handle_new_user` trigger seeds profile + reminder defaults |
| `0002` | RAG: `documents`, `document_chunks` (`vector(2048)`), `match_document_chunks()` RPC, authenticated read-only RLS, no vector index (rationale above) |
| `0003` | `habit_logs.value numeric` for quantitative metrics (water ml, sleep hours) |
| `0004` | Integrity: `mood_logs` unique `(user_id, log_date)` (real upsert); `created_at`/`updated_at` + triggers on log tables; lookup indexes; `NOT NULL` timestamps; `mood` CHECK on the 10 UI ids; `cycle_phase` normalized to stable phase ids + CHECK |
| `0005` | `habits` unique `(user_id, name)` — dedupes duplicates, repoints logs; fixes the water-save PGRST116 race |
| `0006` | `reminder_preferences.enabled` — persists the reminders master switch (backfilled from sub-toggles) |

Hand-maintained TypeScript mirrors live in `src/lib/data/database.types.ts`. The health probe (`/api/health`) checks core + RAG table presence.

---

## Project structure

```
src/
  app/                  App Router: page.tsx, layout.tsx, manifest.ts,
                        api/chat/[persona]/route.ts, api/health/route.ts, auth/*
  components/
    auth/               Gate (routing), LoginView (magic link), OnboardingForm
    chat/               PersonaChat + usePersonaChat (both personas)
    cycle/              CalendarView, DayDetailSheet, PhaseInsightCard
    dashboard/          DashboardView, SettingsView, BentoGrid
    journal/            JournalView, Editor (TipTap), JournalErrorBoundary
    layout/             AppShell, TopNav, DockNav, Dock, ClientProviders
    trends/             TrendsView, TrendsCharts (Recharts)
    background/         AppBackground, PetalField
    ui/                 GlassCard, GlassButton, Toaster, shadcn button
  lib/
    cycle.ts            pure cycle math
    date.ts             todayStr / formatClockTime
    moods.ts            MOODS ids + labels (DB CHECK source of truth)
    personas.ts         PERSONA config (prompts, colors, model, effort, helplines)
    phase-content.ts    per-phase focus/energy/nutrition/exercise/self-care
    store/profile.ts    Zustand cache (partialized persistence)
    data/               one module per domain (profile, cycle, mood, habits,
                        supplements, journal, reminders, chat, export, dev-seed)
    supabase/           browser / server / admin clients
scripts/ingest.mjs      KB → embeddings → Supabase
test/cycle.test.ts      node:test suite for the cycle math + phase mapping
supabase/migrations/    0001–0006 SQL
docs/                   architecture, data-layer reference, how-tos, specs, research
```

---

## Getting started

Prerequisites: Node 22+, pnpm, a Supabase project, and an NVIDIA NIM API key ([build.nvidia.com](https://build.nvidia.com)).

```bash
pnpm install
```

Create `.env.local` from `.env.example`:

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL (required at **build** time) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | RLS-scoped data access (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | health probe + ingestion (`sb_secret_…`) |
| `NVIDIA_NIM_API_KEY` | server only | chat + embeddings |
| `NVIDIA_NIM_MODEL` | server only | optional global model override (default per persona) |
| `NVIDIA_NIM_FALLBACK_MODEL` | server only | retried once on NIM 5xx (default `nvidia/nemotron-3-super-120b-a12b`) |
| `NVIDIA_NIM_REASONING_EFFORT` | server only | `low` / `high` / `max` (NIM rejects `medium`) |
| `NEXT_PUBLIC_ENABLE_DEV_SEED` | client | `"true"` seeds 30 days of mock logs for an empty account |

Apply migrations `0001`–`0006` (Supabase SQL editor → paste each file in order), then build the knowledge base once:

```bash
node scripts/ingest.mjs   # idempotent per document; self-checks retrieval ≥0.3
```

Run the app:

```bash
pnpm dev                  # http://localhost:3000
```

---

## Verification & CI

```bash
pnpm lint          # ESLint (next config + React compiler rules)
npx tsc --noEmit   # strict TypeScript, includes test/
pnpm test          # node:test — cycle math + phase mapping
pnpm build         # production build (Turbopack)
```

GitHub Actions runs `pnpm install --frozen-lockfile`, `pnpm lint`, and `npx tsc --noEmit` on pushes to `Dev`/`main` and on PRs.

---

## Deployment

Vercel + Supabase:

1. **Environment variables** (Production, Preview, Development): the two `NEXT_PUBLIC_*` values as **plain text** — sensitive/secret vars are withheld from the build, and `NEXT_PUBLIC_*` is inlined at build time. `SUPABASE_SERVICE_ROLE_KEY` and `NVIDIA_NIM_API_KEY` as sensitive server-only vars.
2. **Migrations**: apply `0001`–`0006`; the deploy is not ready until `GET /api/health` returns `"ok": true`.
3. **Supabase → Authentication → URL Configuration**: add the production domain to Redirect URLs, or magic-link login breaks.
4. **Ingestion**: run `node scripts/ingest.mjs` at least once (Maya answers ungrounded otherwise).
5. **Smoke test** after deploy: sign in, edit the profile, log water + sleep, write a journal entry, ask both personas (watch thinking stream), export a backup, and check `/api/health`.

Operations runbook: [`docs/howto-operate.md`](docs/howto-operate.md) (migrations, KB rebuilds, key rotation, troubleshooting).

---

## Security & privacy

- RLS on every user table (`auth.uid() = user_id`); reads never need client-side filtering, writes call `requireUserId()`.
- Service-role usage is server-only and build-guarded (`server-only` import).
- Chat route is authenticated and input-capped (40 messages / 8000 chars / 32k thinking chars).
- The Zustand persist cache stores only non-sensitive UI state; health data is always re-fetched.
- Reset flow deletes all rows for the user; export gives you a portable JSON copy.

---

## Intentional limitations

- Reminders fire while the app is open; background push (service-worker subscriptions) is future work.
- The service worker is a passthrough for installability — no offline cache yet.
- No ANN vector index (see RAG rationale); revisit at ~5k chunks.
- Chat thinking (`reasoning_content`) is streamed but **not stored**; only the final reply is persisted, so cross-session preserved thinking degrades gracefully.
- Predictions are statistical estimates; the product does not diagnose or replace clinical care.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how Sakhi fits together and why
- [`docs/reference-data-layer.md`](docs/reference-data-layer.md) — every data hook, table, route, and env var
- [`docs/howto-add-tracker.md`](docs/howto-add-tracker.md) — add a new daily tracker end to end
- [`docs/howto-operate.md`](docs/howto-operate.md) — migrations, RAG ingestion, deploys, troubleshooting
- [`docs/womens_health_kb_rag.md`](docs/womens_health_kb_rag.md) + [`docs/research/`](docs/research) — the research corpus behind Maya's RAG
- Product specs: PRD, feature specs, AI prompt & safety design, data model & RLS schema (in `docs/`)
