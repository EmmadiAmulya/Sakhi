-- 0006_reminder_enabled.sql
-- The Settings master switch was client-only (derived as "any sub-toggle on"),
-- so toggling it on with all sub-toggles off never persisted. Store it.
alter table public.reminder_preferences
  add column if not exists enabled boolean not null default false;

update public.reminder_preferences
set enabled = (coalesce(period_reminder, false) or coalesce(log_nudge, false) or coalesce(supplement_reminder, false))
where enabled = false;
