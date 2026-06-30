# Sakhi — PRD (Product Requirements)

<aside>
📋

Product Requirements Document for **Sakhi** — a privacy-conscious, beautifully designed women's health companion (web MVP, shipped as a PWA).

</aside>

## 1. Overview

Sakhi is a web-based companion for women's health, covering menstrual cycle, mental health & anxiety, habits, supplements, and journaling — paired with two AI assistants. **Beautiful visuals and trust** are the core differentiators.

## 2. Problem statement

Women often juggle several apps for periods, mood, habits, and health questions. Most feel clinical, ad-heavy, or untrustworthy with sensitive data. There's a gap for a single, calming, privacy-respecting companion that blends gentle tracking with empathetic, knowledgeable AI support.

## 3. Target users & personas

- **Primary:** women who want to track cycle / mood / habits and get supportive, trustworthy guidance.
- **Maya, 22** — student, anxious around exams; wants mood + cycle insight and someone to talk to.
- **Priya, 29** — working professional; tracks supplements & habits, wants quick, reliable health answers.

## 4. Goals

- A beautiful, smooth, calming experience (**visuals first**).
- One home for cycle, mood, habits, supplements, and journaling.
- Two AI assistants: empathetic **Companion** + research-grounded **Health guide**.
- A strong, honest privacy posture (RLS + transparency).

## 5. Non-goals (MVP)

- Not a diagnostic or medical device.
- No native mobile app yet.
- No voice mode yet.
- No social / community features.
- No wearable integrations.

## 6. MVP scope

**In:** cycle tracking · mood log · habits · supplements · journal · both AI assistants (RAG) · magic-link auth · sakura UI · PWA.

**Out:** voice mode · notifications/reminders · native app · field-level encryption · multi-language.

## 7. Success metrics

- Daily logging activity (mood/habit entries per active user).
- Retention (D7 / D30).
- AI chat engagement & satisfaction.
- Qualitative: users describe it as **"calming"** and **"trustworthy."**

## 8. Assumptions & constraints

- Free tiers: Vercel, Supabase, NIM tokens.
- Small team / solo build.
- English-first.

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Health/safety liability | Disclaimers + crisis protocol |
| AI hallucination | RAG grounding + citations |
| Free-tier limits | Keep infra lean, stream responses |
| Privacy expectations vs. cloud AI | Transparency + RLS |

## 10. Milestones

See the roadmap (Phases 0–4) in the main project brief.