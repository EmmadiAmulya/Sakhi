-- 0004_db_integrity.sql
-- Schema consistency + integrity fixes from the database audit:
--   1. mood_logs gets the same UNIQUE(user_id, log_date) every other daily
--      table has, so the client can do a real upsert instead of
--      select-then-insert/update (which can duplicate rows under concurrency).
--   2. habit_logs / supplement_logs get created_at/updated_at + the shared
--      update trigger, like cycle_logs, mood_logs and journal_entries.
--   3. Lookup indexes for RLS-filtered reads (user_id + common sort/filter cols).
--   4. Timestamp columns backfilled and made NOT NULL (they already default to
--      now(), and the TS types already declare them non-null).
--   5. Enum guards: `mood` constrained to the UI's stable ids, `cycle_phase`
--      normalized from display names ("Luteal Phase") to stable ids ("luteal")
--      and constrained. Orphaned values become NULL so the constraints validate.

-- 1. mood_logs: dedupe (keep newest by id) then add uniqueness.
delete from public.mood_logs a
using public.mood_logs b
where a.user_id = b.user_id
  and a.log_date = b.log_date
  and a.id < b.id;

alter table public.mood_logs
  add constraint mood_logs_user_id_log_date_key unique (user_id, log_date);

-- 2. Timestamps on the two log tables that lacked them.
alter table public.habit_logs
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.supplement_logs
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

drop trigger if exists handle_updated_at_habit_logs on public.habit_logs;
create trigger handle_updated_at_habit_logs
  before update on public.habit_logs
  for each row execute function public.set_updated_at();

drop trigger if exists handle_updated_at_supplement_logs on public.supplement_logs;
create trigger handle_updated_at_supplement_logs
  before update on public.supplement_logs
  for each row execute function public.set_updated_at();

-- 3. Lookup indexes. (cycle_logs/mood_logs user_id lookups are already covered
--    by their UNIQUE(user_id, log_date) index.)
create index if not exists habits_user_id_name_idx
  on public.habits (user_id, name);
create index if not exists habit_logs_user_id_idx
  on public.habit_logs (user_id);
create index if not exists supplements_user_id_idx
  on public.supplements (user_id, created_at);
create index if not exists supplement_logs_user_id_idx
  on public.supplement_logs (user_id);
create index if not exists journal_entries_user_id_created_at_idx
  on public.journal_entries (user_id, created_at desc);
create index if not exists chat_sessions_user_persona_updated_idx
  on public.chat_sessions (user_id, persona, updated_at desc);
create index if not exists chat_messages_user_id_session_id_idx
  on public.chat_messages (user_id, session_id);
create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

-- 4. Backfill any NULL timestamps, then enforce NOT NULL on every public
--    created_at/updated_at column (keeps the TS mirrors honest).
do $$
declare r record;
begin
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name in ('created_at', 'updated_at')
      and is_nullable = 'YES'
  loop
    execute format('update public.%I set %I = now() where %I is null',
                   r.table_name, r.column_name, r.column_name);
    execute format('alter table public.%I alter column %I set not null',
                   r.table_name, r.column_name);
  end loop;
end $$;

-- 5a. cycle_phase: display name -> stable id, unknown -> NULL.
update public.journal_entries
set cycle_phase = case
  when lower(cycle_phase) like 'menstrual%' then 'menstrual'
  when lower(cycle_phase) like 'follicular%' then 'follicular'
  when lower(cycle_phase) like 'ovulatory%' then 'ovulatory'
  when lower(cycle_phase) like 'luteal%' then 'luteal'
  else null
end
where cycle_phase is not null
  and cycle_phase not in ('menstrual', 'follicular', 'ovulatory', 'luteal');

alter table public.journal_entries
  add constraint journal_entries_cycle_phase_check
  check (cycle_phase is null or cycle_phase in ('menstrual', 'follicular', 'ovulatory', 'luteal'));

-- 5b. mood: the 10 stable ids from the UI picker; orphaned values -> NULL.
update public.cycle_logs set mood = null
  where mood is not null and mood not in
    ('serene', 'energetic', 'sensitive', 'fatigued', 'reflective',
     'anxious', 'down', 'happy', 'stressed', 'irritable');
update public.mood_logs set mood = null
  where mood is not null and mood not in
    ('serene', 'energetic', 'sensitive', 'fatigued', 'reflective',
     'anxious', 'down', 'happy', 'stressed', 'irritable');
update public.journal_entries set mood = null
  where mood is not null and mood not in
    ('serene', 'energetic', 'sensitive', 'fatigued', 'reflective',
     'anxious', 'down', 'happy', 'stressed', 'irritable');

alter table public.cycle_logs
  add constraint cycle_logs_mood_check
  check (mood is null or mood in
    ('serene', 'energetic', 'sensitive', 'fatigued', 'reflective',
     'anxious', 'down', 'happy', 'stressed', 'irritable'));

alter table public.mood_logs
  add constraint mood_logs_mood_check
  check (mood is null or mood in
    ('serene', 'energetic', 'sensitive', 'fatigued', 'reflective',
     'anxious', 'down', 'happy', 'stressed', 'irritable'));

alter table public.journal_entries
  add constraint journal_entries_mood_check
  check (mood is null or mood in
    ('serene', 'energetic', 'sensitive', 'fatigued', 'reflective',
     'anxious', 'down', 'happy', 'stressed', 'irritable'));
