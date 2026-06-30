# Sakhi — Feature Specs

<aside>
🧩

Detailed feature behavior for the Sakhi MVP. Each feature lists purpose, user actions, data captured, states, and edge cases.

</aside>

## Cross-cutting

### Onboarding

- **Purpose:** warm welcome, set expectations, collect minimal setup (optional cycle info).
- **Actions:** intro screens (sakura animation), privacy explainer, optional last-period date & average cycle length.
- **States:** first launch only; skippable.
- **Edge:** user skips all → sensible defaults, prompts later.

### Auth (magic link)

- **Purpose:** passwordless, private sign-in.
- **Actions:** enter email → receive link → authenticated session.
- **States:** signed out, link-sent, signed in, expired link.
- **Edge:** wrong email, expired/used link → resend flow.

### Home / Dashboard

- **Purpose:** calming daily snapshot.
- **Actions:** view today's cycle phase, mood prompt, habit checklist, quick-add, open assistants.
- **States:** empty (first use), populated.

## 1. Cycle tracking

- **Purpose:** log periods, predict next cycle, show current phase.
- **Actions:** mark period start/end, log flow & symptoms, view calendar + predictions.
- **Data:** period start/end, cycle length, flow intensity, symptoms[].
- **States:** no data (estimate from onboarding), predicting, logging.
- **Edge:** irregular cycles, missed logs, very short/long cycles → widen prediction confidence.

## 2. Mood log

- **Purpose:** quick daily emotional check-in.
- **Actions:** pick mood (scale/emoji), optional tags (anxious, calm, tired), optional note.
- **Data:** mood value, tags[], note, timestamp.
- **States:** not logged today, logged.
- **Edge:** multiple logs/day allowed; trends need ≥7 days of data.

## 3. Habits tracker

- **Purpose:** build supportive daily habits (water, sleep, movement).
- **Actions:** create habit, check off daily, view streaks.
- **Data:** habit definition (name, cadence, icon), daily completion logs.
- **States:** no habits, active, completed-today.
- **Edge:** archived habits, streak resets, retroactive check-off.

## 4. Supplements tracker

- **Purpose:** track supplements/vitamins and adherence.
- **Actions:** add supplement (name, dose, schedule), mark taken, view history.
- **Data:** supplement (name, dose, schedule), intake logs.
- **States:** none, scheduled-today, taken.
- **Edge:** as-needed vs scheduled; **dosage info is informational, not advice**.

## 5. Journal / diary

- **Purpose:** private free-form reflection.
- **Actions:** create/edit/delete entries, optional mood link, browse by date.
- **Data:** entry text, timestamp, optional mood reference.
- **States:** empty, drafting, saved.
- **Edge:** long entries, autosave, privacy emphasis.

## 6. Companion AI (🌸)

- **Purpose:** empathetic friend/therapist-style conversation.
- **Actions:** open chat, talk freely; assistant uses recent mood/journal context.
- **Behavior:** warm, non-judgmental, supportive; remembers conversation.
- **Safety:** crisis detection → helplines; never a replacement for professional care.
- **Edge:** sensitive topics, long sessions (summarize history).

## 7. Health guide AI (🩺)

- **Purpose:** factual answers grounded in the research docs.
- **Actions:** ask health questions; assistant retrieves from RAG and answers with citations.
- **Behavior:** factual, cautious, cites sources, always adds "not medical advice."
- **Edge:** out-of-scope/no relevant context → say so, suggest professional help.

## Feature states checklist (every screen)

- [ ]  Empty state designed
- [ ]  Loading state designed
- [ ]  Error state designed
- [ ]  Success/filled state designed