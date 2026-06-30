# Sakhi — Women's Health Companion (MVP Project Brief)

<aside>
🌸

A privacy-conscious women's health companion. **Visuals first**: a sakura-themed web app with ultra-smooth animations, plus cycle/mood/habit/supplement tracking, journaling, and two AI assistants — an empathetic companion and a research-grounded health guide.

</aside>

## 1. Vision

**Project name: Sakhi** (means "friend" — fitting for a supportive companion). A beautiful, calming daily companion for women's health — covering menstrual cycle, mental health & anxiety, habits, supplements, and common vitamin/mineral deficiencies. The experience prioritizes **gorgeous, smooth visuals** and **trust**, with AI that feels supportive rather than clinical.

## 2. Platform decision

**Decision: Web MVP (shipped as a PWA), native mobile later.**

| Factor | Verdict |
| --- | --- |
| Fastest path to a polished visuals MVP | ✅ Web |
| AI is cloud anyway (NIM/Nemotron) | Local-only DB gains lost → cloud is coherent |
| Iteration & feedback (share a link) | ✅ Web, no app-store friction |
| App-like feel (install, home icon, offline shell) | ✅ via PWA |
| Future native upgrade path | Capacitor wrap, or rebuild in Flutter/React Native |

## 3. Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js (App Router)** | Server routes safely hold the NIM key |
| Styling | **Tailwind CSS** | Build the sakura design system fast |
| Animations | **Framer Motion** (+ **GSAP** for advanced) | The visuals priority — transitions, petals, springs |
| DB + Auth + Storage | **Supabase** (Postgres) | With **Row-Level Security** |
| Vector search (RAG) | **Supabase pgvector** | No separate vector DB needed |
| AI model | **NVIDIA NIM — Nemotron** | Free tokens, ~1M context |
| Voice (post-MVP) | Web Speech API → later Whisper + ElevenLabs | Defer for MVP |
| Hosting | Vercel | Easy deploy + edge functions |

## 4. Architecture

- **Frontend (Next.js):** browser only ever talks to *your* server endpoints — never directly to NVIDIA.
- **Backend:** Next.js server actions / API routes → Supabase + NIM.
- **Auth & data isolation:** Supabase Auth + **Row-Level Security** so each user can only read/write their own rows. Non-negotiable for sensitive health data.
- **AI calls:** browser → your server route → Nemotron (key stays server-side).

## 5. AI assistants — one backend, two personas

<aside>
🌸

**Companion** — warm, empathetic "friend/therapist" tone. Uses the user's mood & journal context for continuity. Leans on the large context window for long, ongoing conversations.

</aside>

<aside>
🩺

**Health guide** — factual and grounded. Answers via **RAG over your research docs**, cites sources, always includes a "not medical advice" disclaimer.

</aside>

Implementation: same model, switched by **system prompt + retrieval source**. Keeps the backend simple.

### Crisis safety (build from day one)

- Detect self-harm / crisis language and surface **real helplines**.
- The companion must never present itself as a replacement for professional care.

## 6. RAG pipeline (the 5 research `.md` docs)

1. **Chunk** the markdown docs into passages (e.g. by heading / ~500–800 tokens).
2. **Embed** each chunk with an embeddings model.
3. **Store** vectors + text in Supabase (`pgvector`).
4. **Retrieve** top-k relevant chunks at query time.
5. **Inject** retrieved passages into the Nemotron prompt and answer with citations.

> Use RAG for *knowledge accuracy* and the 1M context for *conversation memory* — they solve different problems.
> 

## 7. MVP feature scope

- [ ]  Cycle tracking
- [ ]  Mood log
- [ ]  Habits tracker
- [ ]  Supplements tracker
- [ ]  Journal / diary
- [ ]  Companion AI (empathetic chat)
- [ ]  Health guide AI (RAG-grounded + citations)
- [ ]  Sakura design system + smooth animations
- [ ]  Auth + per-user data isolation (RLS)
- [ ]  PWA install support

**Post-MVP / optional**

- [ ]  Voice mode (STT → AI → TTS)
- [ ]  Notifications / reminders
- [ ]  Native mobile app
- [ ]  Field-level encryption for sensitive data

## 8. Sakura design system

- **Palette:** soft pinks, blossom whites, gentle gradients; calm, airy spacing.
- **Motion:** petal/particle effects, blooming micro-interactions, spring-physics transitions, smooth page changes.
- **Tone:** gentle, reassuring, non-clinical.
- Define design tokens early (colors, radii, shadows, motion curves) so visuals stay consistent.
- **Current UI direction (pending UI research):** light pink & white background, petals drifting in the wind for a peaceful vibe, and a **glassmorphism** style so everything feels aesthetic and intentionally designed.

## 9. Privacy & safety

- **It's now a *secure cloud* story, not local-only** — own that honestly in-app.
- Supabase **RLS** for per-user isolation; consider encrypting sensitive fields at rest.
- Be transparent: "Entries are stored securely and isolated to your account; AI features send text to a third-party model."
- Persistent **"not medical advice — consult a professional"** disclaimers, especially for supplements & deficiency suggestions.

## 10. Roadmap

1. **Phase 0 — Foundation:** Next.js + Tailwind + Supabase project, auth, RLS, sakura design tokens.
2. **Phase 1 — Visuals MVP:** core screens + animations, trackers + journal CRUD.
3. **Phase 2 — AI:** NIM integration, two personas, RAG over the 5 docs.
4. **Phase 3 — Polish:** PWA, crisis safety, disclaimers, onboarding.
5. **Phase 4 — Optional:** voice mode, reminders, native app.

## 11. Finalized stack decisions (locked)

| Layer | Decision |
| --- | --- |
| UI components | **shadcn/ui** (Radix + Tailwind, fully customizable) |
| Database access | **Supabase JS client** |
| Embeddings (RAG) | **NVIDIA NIM embeddings** (single AI provider) |
| AI orchestration | **Vercel AI SDK** (lightweight streaming) + manual `pgvector` retrieval — no LangChain |
| Auth | **Email magic link only** |
| Charts | **Recharts** |
| State / data fetching | **TanStack Query**  • **Zustand** |
| Forms & validation | **react-hook-form**  • **Zod** |
| PWA | **Serwist** |
| Tooling | **pnpm**  • ESLint + Prettier |

## 12. Vercel free-tier constraints to respect

- **Stream AI responses** so requests don't hit function time limits; keep route handlers fast and lightweight.
- **Embed the 5 docs once** via an offline seed script — never run heavy embedding jobs on a live request.
- **Watch bandwidth (~100 GB/mo):** optimize images and animation assets; lazy-load heavy visuals.
- **Lean dependencies** to reduce cold starts and bundle size.
- Single deploy region is fine for the MVP.
- Keep the project intentionally simple — the complexity budget goes to the **visuals**, not the infra.

## 13. Remaining open decisions

- Voice: Web Speech API vs. cloud STT/TTS (revisit post-MVP)
- Whether to encrypt journal entries at the field level

## 14. Project documents

- [Sakhi — PRD (Product Requirements)](Sakhi%20%E2%80%94%20PRD%20(Product%20Requirements)%20263941181c2949ff9e8e83679293ab56.md)
- [Sakhi — Feature Specs](Sakhi%20%E2%80%94%20Feature%20Specs%206377ddea61084ce48a24fb91345e0ee1.md)
- [Sakhi — Data Model & RLS Schema](Sakhi%20%E2%80%94%20Data%20Model%20&%20RLS%20Schema%209d3d017502604f09933eedfcde9e5020.md)
- [Sakhi — AI Prompt & Safety Design](Sakhi%20%E2%80%94%20AI%20Prompt%20&%20Safety%20Design%20bfec109c9fea42a5bc691248f6be3e16.md)

[Sakhi — PRD (Product Requirements)](Sakhi%20%E2%80%94%20PRD%20(Product%20Requirements)%20263941181c2949ff9e8e83679293ab56.md)

[Sakhi — Data Model & RLS Schema](Sakhi%20%E2%80%94%20Data%20Model%20&%20RLS%20Schema%209d3d017502604f09933eedfcde9e5020.md)

[Sakhi — Feature Specs](Sakhi%20%E2%80%94%20Feature%20Specs%206377ddea61084ce48a24fb91345e0ee1.md)

[Sakhi — AI Prompt & Safety Design](Sakhi%20%E2%80%94%20AI%20Prompt%20&%20Safety%20Design%20bfec109c9fea42a5bc691248f6be3e16.md)