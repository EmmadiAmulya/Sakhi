-- 0003_habit_values.sql
-- Quantitative daily metrics (water ml, sleep hours) on habit_logs.
-- `done` stays for checkable habits; value holds the number when one exists.

alter table public.habit_logs add column if not exists value numeric;
