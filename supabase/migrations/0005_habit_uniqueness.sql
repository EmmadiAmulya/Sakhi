-- 0005_habit_uniqueness.sql
-- habits had no UNIQUE(user_id, name). getHabitId()'s select-then-insert never
-- hit a conflict, so concurrent saves (rapid water clicks) inserted duplicate
-- "Water" rows; every later lookup then failed with PGRST116
-- ("JSON object requested, multiple (or no) rows returned") because it used
-- .maybeSingle(). Dedupe existing rows, repoint their logs, then constrain.
--
-- Dedupe runs as a DO block (no temp table) so the migration creates nothing
-- without RLS. The DELETE/UPDATE are the intended dedupe: for each duplicated
-- (user_id, name) the oldest row is kept, non-colliding logs are repointed to
-- it, and logs that would collide on (habit_id, log_date) are dropped.

do $$
declare
  d record;
begin
  for d in
    select id,
           first_value(id) over (
             partition by user_id, name
             order by created_at nulls first, id
           ) as keeper_id,
           row_number() over (
             partition by user_id, name
             order by created_at nulls first, id
           ) as rn
    from public.habits
  loop
    if d.rn > 1 then
      delete from public.habit_logs hl
      where hl.habit_id = d.id
        and exists (
          select 1 from public.habit_logs k
          where k.habit_id = d.keeper_id and k.log_date = hl.log_date
        );

      update public.habit_logs
      set habit_id = d.keeper_id
      where habit_id = d.id;

      delete from public.habits where id = d.id;
    end if;
  end loop;
end $$;

alter table public.habits
  add constraint habits_user_id_name_key unique (user_id, name);
