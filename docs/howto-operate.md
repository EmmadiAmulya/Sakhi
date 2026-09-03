# How to operate Sakhi

Recurring ops tasks: migrations, RAG ingestion, key rotation, deploys.
End result: a healthy production instance you can verify in one URL.

## Prerequisites

- Supabase project dashboard access; Vercel project access for deploys.
- `.env.local` filled in (see `.env.example`).

## Apply a migration

1. Open Supabase Dashboard → SQL Editor → New query.
2. Paste the full contents of `supabase/migrations/NNNN_*.sql` (in order).
3. Run. Expect "Success, no rows returned".

## Rebuild the knowledge base

Run from the repo root (idempotent per document — safe to re-run after
editing any KB markdown under `docs/`):

```bash
node scripts/ingest.mjs
```

Expect `Done. document_chunks total: N` plus a self-check line showing a
relevant chunk with similarity ≥ 0.3. If the self-check fails, the script
exits 1 — do not deploy RAG changes until it passes.

## Rotate the NIM key

1. Generate a new key at build.nvidia.com.
2. Update `NVIDIA_NIM_API_KEY` in `.env.local` **and** in the Vercel project
   environment variables, then redeploy.

## Deploy checklist

- [ ] Migrations 0001–0003 applied (verify: `GET /api/health` → `"ok": true`,
      `"rag": {"ok": true, ...}`).
- [ ] Vercel env vars set: the two `NEXT_PUBLIC_*` keys plus
      `SUPABASE_SERVICE_ROLE_KEY` and `NVIDIA_NIM_API_KEY` (server only).
- [ ] Supabase → Authentication → URL Configuration: add the production
      domain to Redirect URLs (else magic-link login breaks post-deploy).
- [ ] Ingestion run at least once (Maya answers ungrounded otherwise — she
      still works, just without citations).

## Verification

`https://<your-app>/api/health` is the single health signal: connectivity,
core tables, and RAG tables in one JSON payload.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `Could not find the table 'public.…' in the schema cache` | Migration not applied → apply it (above) |
| Chat returns "Not signed in." | session expired or cookies blocked → sign in again |
| Maya answers truncate mid-sentence | `max_tokens` too low in `api/chat/[persona]/route.ts` (currently 2048) |
| Ingestion `415 Content-Type must be application/json` | regression in `scripts/ingest.mjs` embed headers — must send JSON content type |
| Ingestion `ivfflat … more than 2000 dimensions` | someone re-added a vector index — remove it; 2048-dim embeddings can't be indexed by pgvector |
| `.env.local` values silently ignored by a script | file uses CRLF — parse with `/\r?\n/`, never `"\n"` |
| `Notification` permission stuck | browser-level block — user must re-enable in site settings; in-app toggle can't override it |
