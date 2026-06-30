# Sakhi — Data Model & RLS Schema

<aside>
🗄️

Supabase (Postgres) schema for Sakhi, including **Row-Level Security** and **pgvector** for RAG. All user data is isolated by `auth.uid()`.

</aside>

## Conventions

- Every user-owned table has `user_id uuid` referencing `auth.users`.
- **RLS enabled on all tables**; base policy: `user_id = auth.uid()`.
- Standard columns: `id uuid pk`, `created_at`, `updated_at`.

## Tables overview

| Table | Purpose |
| --- | --- |
| `profiles` | User profile + onboarding prefs |
| `cycle_logs` | Period start/end, flow, symptoms |
| `mood_logs` | Daily mood check-ins |
| `habits` / `habit_logs` | Habit definitions + completions |
| `supplements` / `supplement_logs` | Supplement defs + intake |
| `journal_entries` | Free-form journaling |
| `chat_sessions` / `chat_messages` | AI conversations (per persona) |
| `documents` / `document_chunks` | RAG source docs + embeddings |

## Schema sketch

```sql
-- Profiles
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  avg_cycle_length int default 28,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cycle logs
create table cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  period_start date not null,
  period_end date,
  flow_intensity text,        -- light | medium | heavy
  symptoms text[] default '{}',
  created_at timestamptz default now()
);

-- Mood logs
create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  mood int not null,          -- e.g. 1..5
  tags text[] default '{}',
  note text,
  logged_at timestamptz default now()
);

-- Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  icon text,
  cadence text default 'daily',
  archived boolean default false,
  created_at timestamptz default now()
);
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  habit_id uuid not null references habits(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz default now()
);

-- Supplements
create table supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  dose text,
  schedule text,              -- daily | as_needed | custom
  created_at timestamptz default now()
);
create table supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  supplement_id uuid not null references supplements(id) on delete cascade,
  taken_at timestamptz default now()
);

-- Journal
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  body text not null,
  mood_id uuid references mood_logs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  persona text not null,      -- companion | health_guide
  title text,
  created_at timestamptz default now()
);
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null,         -- user | assistant
  content text not null,
  created_at timestamptz default now()
);
```

## RAG (pgvector)

```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  created_at timestamptz default now()
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  embedding vector(1024)      -- ⚠️ set dimension to match the NIM embedding model
);

create index on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Retrieval helper
create or replace function match_document_chunks(
  query_embedding vector(1024),
  match_count int default 5
) returns table (id uuid, content text, similarity float)
language sql stable as $$
  select c.id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

> RAG docs are **global knowledge** (not user data), so `documents`/`document_chunks` are read-only to users and managed by an offline seed script.
> 

## Row-Level Security (pattern)

```sql
-- Apply to every user-owned table
alter table mood_logs enable row level security;
create policy "own rows" on mood_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Repeat for `cycle_logs`, `habits`, `habit_logs`, `supplements`, `supplement_logs`, `journal_entries`, `chat_sessions`, `chat_messages`, and `profiles` (keyed on `id`).

## Open items

- Confirm embedding **vector dimension** for the chosen NIM model.
- Decide whether to encrypt `journal_entries.body` at the field level.