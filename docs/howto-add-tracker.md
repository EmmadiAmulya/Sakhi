# How to add a new daily tracker

Adds a persisted per-day metric (e.g. sleep hours, step count) end to end:
migration → types → data hooks → dashboard UI. Assumes familiarity with the
[data-layer conventions](reference-data-layer.md#conventions).

## Prerequisites

- `.env.local` filled in (see `.env.example`); migrations 0001–0003 applied.
- Dev server running (`pnpm dev`).

## Steps

1. **Decide boolean vs numeric.** Checkable habit → reuse `habits`/`habit_logs`
   with no schema change. Numeric metric → reuse them too via the `value`
   column (0003). You only need a new table if the metric has extra fields.

2. **Add the query key** in `src/lib/data/keys.ts` if the read is a new shape,
   e.g. reuse `habitLogs(date)` for habit-backed metrics — no new key needed.

3. **Write the data module** (`src/lib/data/<name>.ts`), copying
   `mood-logs.ts`: a `fetch*` function, a `use*` query hook keyed by
   `todayStr()`, and an upsert mutation with optimistic update + rollback +
   toast. For habit-backed numerics, copy `habits.ts` instead — it already
   handles auto-creating the habit row.

4. **Mirror any schema change in `database.types.ts`** by hand (same PR, same
   diff — the file has no codegen yet).

5. **Wire the view**: replace local `useState` with the hooks (see
   `DashboardView`'s water block: `useHabitValue("Water")` +
   `useSetHabitValue("Water")`), keeping the glass UI untouched.

## Verification

- `npx tsc --noEmit` and `npx eslint src/lib/data src/components` pass.
- In the app: change the value, refresh — it persists. Check the row in
  Supabase Table Editor (`habit_logs` filtered by today).
- `GET /api/health` still returns `"ok": true`.

## Troubleshooting

- **Toast "Couldn't save …"**: the column doesn't exist (migration not
  applied) or RLS blocks the write — check the SQL editor and table policies.
- **Value resets on refresh**: you kept a local `useState` as source of truth
  instead of the query data — delete it and read from the hook.
- **`null` TypeScript errors on query data**: `data` is `T | undefined` and
  nullable columns stay nullable — coalesce at the call site (`?? 0`).
