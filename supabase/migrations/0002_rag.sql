-- 0002_rag.sql
-- RAG knowledge base for Maya (global, non-user data).
-- Embedding dim 2048 = nvidia/nemotron-3-embed-1b on NVIDIA NIM.

create extension if not exists vector;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  created_at timestamptz default now()
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  embedding vector(2048)
);

-- Global knowledge: readable by signed-in users; writes happen only via the
-- service-role ingestion script, which bypasses RLS.
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

create policy "Authenticated users can read documents"
  on public.documents for select to authenticated using (true);

create policy "Authenticated users can read document chunks"
  on public.document_chunks for select to authenticated using (true);

-- ponytail: no ANN index — pgvector caps indexes at 2000 dims and our corpus
-- (~10s of chunks) does exact scan in microseconds with perfect recall.
-- Revisit when chunks pass ~5k (then truncate embeddings to 1024 + ivfflat/hnsw).

create or replace function public.match_document_chunks(
  query_embedding vector(2048),
  match_count int default 5
)
returns table (id uuid, content text, similarity float)
language sql stable as $$
  select c.id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_document_chunks(vector(2048), int) to authenticated;
