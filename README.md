# Sakhi — Women's Health Companion

A privacy-first, sakura-themed PWA for cycle tracking, journaling, mood/habit logging, and two AI companions:

- **Sakhi** — empathetic emotional support
- **Maya** — evidence-based health guide, grounded (RAG) in a peer-reviewed women's-health knowledge base

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (auth + Postgres + RLS + pgvector) · NVIDIA NIM (`llama-3.3-nemotron-super-49b-v1.5`) · TanStack Query · Framer Motion

## Architecture

- **User data** flows browser → Supabase directly, protected by Row-Level Security (`src/lib/data/*`)
- **AI** flows browser → `/api/chat/[persona]` server route → NVIDIA NIM; the API key never reaches the client. Maya answers are grounded via pgvector retrieval over `document_chunks`
- **Migrations**: `supabase/migrations/*.sql`, applied via the Supabase SQL editor

## Setup

```bash
pnpm install
```

Create `.env.local` (see `.env.example` values in docs):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=   # server only — health check, RAG ingestion
NVIDIA_NIM_API_KEY=nvapi-... # server only
```

Apply migrations `0001`–`0003` in the Supabase SQL editor, then build the knowledge base once:

```bash
node scripts/ingest.mjs
```

## Develop

```bash
pnpm dev      # http://localhost:3000
pnpm lint
npx tsc --noEmit
```
