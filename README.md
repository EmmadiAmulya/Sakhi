# Sakhi 🌸

**Sakhi** is a privacy-conscious women's health companion designed around one idea: health tracking should feel calm, personal, and human rather than clinical.

The project brings menstrual-cycle tracking, mood and wellness logging, journaling, and two distinct conversational experiences into one sakura-themed interface:

- **Sakhi** — an empathetic companion for emotional support, reflection, stress, and cycle-related feelings.
- **Maya** — a structured health guide intended for evidence-grounded women's-health information and safety-oriented handoffs.

> **Project status:** Sakhi is currently a frontend-focused MVP/prototype. The repository contains a working interactive experience with locally persisted state, mock data, cycle calculations, journal editing, wellness trends, simulated authentication, and simulated assistant responses. The repository's `docs/` directory also contains the planned production architecture for Supabase, RLS, pgvector/RAG, NVIDIA NIM, and stronger AI safety controls. Those backend integrations should be treated as architectural plans unless the corresponding implementation exists in the codebase.

**Live demo:** https://sakhi-sa-k.vercel.app

---

## What Sakhi does

Sakhi is built as a single daily workspace rather than a collection of disconnected trackers.

### 🌸 Cycle tracking

- Calendar-based cycle logging
- Mark period days and flow intensity
- Track symptoms such as cramps, bloating, headache, fatigue, acne, nausea, and breast tenderness
- Record mood and energy for individual days
- Add free-form observations
- Estimate current cycle day and phase from the user's profile
- Calculate cycle-related metrics from logged data

### 🧠 Mood & wellness

- Daily mood selection
- Energy/stamina tracking
- Water intake tracking
- Sleep tracking
- Supplement checklist
- Daily notes
- Wellness trend visualizations when enough data is available

### 📖 Private journal

The journal supports richer free-form entries rather than just short notes.

- Create journal entries
- Edit existing entries
- Delete entries
- Rich-text editing through Tiptap
- Store both structured editor content and plain-text previews
- Associate entries with mood/cycle context

### 💬 Two assistant experiences

#### Sakhi — empathetic companion

Sakhi is designed as the emotional-support side of the product.

The intended behavior is:

- warm and conversational
- non-judgmental
- supportive rather than clinical
- focused on listening, emotional validation, stress, mood, and cycle-related feelings
- hand off medical questions to Maya rather than pretending to be a doctor

The current repository implements the UI and persona behavior locally with simulated responses.

#### Maya — health guide

Maya is designed as the factual/health-information side.

The intended behavior is:

- structured and clear
- evidence-minded
- focused on women's health, cycle-related symptoms, hormones, nutrition, and general wellness
- explicit about the limits of medical information
- capable of surfacing emergency guidance for red-flag symptoms
- able to hand emotional-support conversations back to Sakhi

The current UI contains local keyword-based mock responses and emergency/handoff flows. The production RAG architecture described in `docs/` is not currently wired into the frontend.

---

## Current implementation

The current codebase is more than the original Next.js starter template. The initial README was still the default `create-next-app` README, but the application has since grown into a structured MVP.

The main application flow is:

```
Login
  ↓
Onboarding
  ↓
App Shell
  ├── Dashboard
  ├── Cycle Calendar
  ├── Sakhi
  ├── Maya
  ├── Journal
  └── Settings
```

The application entry point routes between these views through `src/app/page.tsx`.

### Authentication & onboarding

The current MVP has a simulated passwordless login flow:

1. User enters an email address.
2. The UI simulates sending a magic link.
3. Authentication is simulated locally.
4. First-time users are taken through onboarding.
5. Profile information is persisted in the client-side Zustand store.

Onboarding collects:

- preferred name
- age
- height
- weight
- average cycle length
- last period start date

The production design documents specify Supabase Auth with real email magic links, but that integration is not present in the current implementation.

### Local state & persistence

Sakhi currently uses **Zustand** with the persist middleware.

The primary store is:

```
src/lib/store/profile.ts
```

It currently manages:

- profile data
- login/onboarding state
- cycle logs
- journal entries
- reminder preferences
- cycle-log mutations
- journal CRUD
- profile updates
- logout/reset behavior

Persisted state uses the browser's local storage through Zustand's `persist` middleware.

This is intentionally different from the production architecture described in the project documentation, which proposes Supabase + Row-Level Security for user-owned data.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 — App Router |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Component primitives | shadcn/ui / Base UI |
| State | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| Rich text | Tiptap |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Package manager | pnpm |
| Formatting | Prettier + Tailwind plugin |
| Linting | ESLint |
| Deployment | Vercel |

---

## Project structure

```
Sakhi/
├── docs/
│   ├── research/
│   │   ├── vertical_1_menstrual_health.md
│   │   ├── vertical_2_mental_health.md
│   │   ├── vertical_3_micronutrients.md
│   │   ├── vertical_4_mood_neurochemical.md
│   │   └── vertical_5_interdependencies_matrix.md
│   ├── Sakhi — PRD (Product Requirements) ...
│   ├── Sakhi — Feature Specs ...
│   ├── Sakhi — Data Model & RLS Schema ...
│   ├── Sakhi — AI Prompt & Safety Design ...
│   └── Sakhi — Women's Health Companion ...
│
├── public/
│   └── assets/
│       ├── sakura-bg-mob.png
│       └── sakura-bg-pc.jpg
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── background/
│   │   ├── cycle/
│   │   ├── dashboard/
│   │   ├── journal/
│   │   ├── layout/
│   │   ├── trends/
│   │   └── ui/
│   │
│   └── lib/
│       ├── cycle.ts
│       ├── mock-data.ts
│       ├── motion.ts
│       ├── personas.ts
│       ├── phase-content.ts
│       ├── store/
│       └── utils.ts
│
├── test/
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.json
```

### Component responsibilities

**`components/auth/`**

Authentication gate, simulated login, onboarding, and profile setup.

**`components/dashboard/`**

The primary daily workspace, including cycle summary, habits, supplements, journal shortcuts, and navigation to the two assistants.

**`components/cycle/`**

Calendar and detailed day logging for periods, flow, symptoms, mood, energy, and notes.

**`components/journal/`**

Tiptap-based journal editor, entry browsing, editing, deletion, and error handling.

**`components/trends/`**

Cycle/wellness analytics and Recharts visualizations. Charts are dynamically imported to keep the initial client bundle smaller.

**`components/layout/`**

Application shell, top navigation, dock navigation, and client-side providers.

**`components/background/`**

Sakura visual system, background treatment, and animated petals.

**`components/ui/`**

Reusable glassmorphism-style UI primitives and buttons.

**`lib/cycle.ts`**

Cycle calculations, phase logic, cycle metrics, and related data transformations.

**`lib/store/profile.ts`**

Central persisted client-side application state.

**`lib/personas.ts`**

Definitions, behavior, tone, disclaimers, and safety metadata for Sakhi and Maya.

---

## Design system

The interface intentionally avoids the visual language of a conventional medical dashboard.

The current design direction uses:

- Sakura-inspired pink and plum accents
- soft whites and translucent surfaces
- glassmorphism cards
- serif display typography paired with clean sans-serif UI text
- drifting petal visuals
- spring-based page transitions
- subtle hover and interaction states
- generous spacing and rounded surfaces
- responsive layouts for desktop and mobile widths

The goal is to make sensitive health interactions feel approachable without hiding that the underlying information can be serious.

---

## Data model: current vs. planned

There are two different layers in the repository, and keeping them separate is important.

### Current MVP

The current implementation is client-side:

```
React components
      ↓
Zustand store
      ↓
Browser persistence
      ↓
Local/mock data
```

No Supabase database or production AI API is required to run the current UI.

### Planned production architecture

The project documentation specifies a server-backed architecture:

```
Browser
   ↓
Next.js application
   ↓
Server routes / actions
   ├── Supabase Auth
   ├── Supabase Postgres + RLS
   ├── pgvector retrieval
   └── NVIDIA NIM
             ↓
       AI responses
```

The intended production model is that user-owned data is isolated with **Row-Level Security**, while health knowledge is stored separately as a global RAG knowledge base.

The planned RAG flow is:

```
Research documents
       ↓
Chunking
       ↓
Embeddings
       ↓
Supabase pgvector
       ↓
User question
       ↓
Vector retrieval
       ↓
Relevant passages
       ↓
Health-guide prompt
       ↓
Grounded answer + citations
```

These documents are already present under `docs/research/` and document the intended knowledge base.

---

## Privacy & safety direction

Privacy is a core product requirement rather than an afterthought.

The production design calls for:

- per-user data isolation
- Supabase Row-Level Security
- transparent handling of data sent to external AI providers
- clear medical-information disclaimers
- no diagnosis or prescription behavior
- crisis and emergency escalation
- explicit separation between emotional support and health guidance

The current MVP demonstrates several of these UX patterns, including medical disclaimers, emergency cards, and handoff from Maya to Sakhi.

However, the current local-storage implementation should **not** be interpreted as production-grade medical-data infrastructure. The production privacy architecture remains a backend integration task.

---

## Safety model for the assistants

Sakhi and Maya deliberately have different roles.

| | Sakhi 🌸 | Maya 🩺 |
| --- | --- | --- |
| Primary role | Emotional companion | Health information guide |
| Tone | Warm, empathetic | Calm, structured |
| Focus | Mood, stress, reflection | Symptoms, cycle, nutrition, health information |
| Medical diagnosis | No | No |
| Prescription advice | No | No |
| Emergency escalation | Planned | Implemented in current mock flow |
| RAG grounding | Planned | Planned |
| Professional-care handoff | Yes | Yes |

The detailed safety design lives in:

```
docs/Sakhi — AI Prompt & Safety Design ...
```

The safety documentation should be treated as a design specification, not as proof that every production safeguard has already been implemented.

---

## Research & documentation

The repository contains a substantial product and research layer in addition to the application code.

### Product documentation

- **PRD** — product vision, goals, target users, MVP scope, risks, and roadmap
- **Feature Specs** — detailed feature behavior, states, actions, and edge cases
- **Data Model & RLS Schema** — proposed Supabase/Postgres schema and security model
- **AI Prompt & Safety Design** — assistant personas, RAG behavior, citations, disclaimers, and crisis protocol
- **MVP Project Brief** — consolidated product, architecture, stack, privacy, and roadmap decisions

### Research

The research directory currently contains dedicated material covering:

- menstrual health
- mental health
- micronutrients
- mood/neurochemical relationships
- interdependencies between the research areas

There are also supporting research visualizations for menstrual-cycle hormones and nutrient interactions.

---

## Running locally

### Prerequisites

- Node.js
- pnpm

### Install dependencies

```bash
pnpm install
```

### Start the development server

```bash
pnpm dev
```

Then open:

```
http://localhost:3000
```

### Production build

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

At the current stage, no external API keys are required for the core frontend experience because authentication and assistant responses are simulated locally.

---

## Current limitations

The repository is intentionally ahead of its original starter README, but it is still an MVP.

Current limitations include:

- Authentication is simulated rather than backed by Supabase Auth.
- User data is persisted locally through Zustand rather than a server database.
- Assistant responses are mock/keyword-driven rather than generated by an LLM.
- RAG retrieval and citation generation are documented but not wired into the current frontend.
- Supabase/Postgres/pgvector are architectural targets, not current runtime dependencies.
- PWA support is part of the product plan but is not represented by a Serwist dependency in the current package.
- Reminder preferences currently focus on browser notification permission and local UI state.
- International emergency-helpline localization is still incomplete.
- Production-grade encryption and sensitive-field handling remain open architecture items.
- Medical/health claims should not be treated as personalized medical advice.

---

## Roadmap

### Phase 0 — Foundation
- [x] Next.js application foundation
- [x] Sakura design system
- [x] Core component structure
- [x] Client-side state model
- [x] Product and safety documentation

### Phase 1 — Visual MVP
- [x] Dashboard
- [x] Cycle calendar
- [x] Cycle/day logging
- [x] Mood and wellness tracking
- [x] Supplements tracker
- [x] Journal
- [x] Settings
- [x] Responsive UI
- [x] Motion and visual polish

### Phase 2 — Production AI
- [ ] Server-side AI integration
- [ ] Sakhi conversational backend
- [ ] Maya health-guide backend
- [ ] Research-document ingestion
- [ ] Embeddings + pgvector retrieval
- [ ] Source-aware citations
- [ ] Conversation persistence

### Phase 3 — Production privacy & safety
- [ ] Supabase authentication
- [ ] Row-Level Security
- [ ] Production data model
- [ ] Robust crisis detection
- [ ] Region-aware emergency resources
- [ ] Stronger privacy controls
- [ ] Field-level encryption evaluation

### Phase 4 — Product expansion
- [ ] PWA hardening
- [ ] Notifications/reminders
- [ ] Voice interaction
- [ ] Native mobile client
- [ ] Additional personalization

---

## Project documentation

The repository's `docs/` directory contains the deeper design material:

- [PRD](./docs/Sakhi%20%E2%80%94%20PRD%20(Product%20Requirements)%20263941181c2949ff9e8e83679293ab56.md)
- [Feature Specs](./docs/Sakhi%20%E2%80%94%20Feature%20Specs%206377ddea61084ce48a24fb91345e0ee1.md)
- [Data Model & RLS Schema](./docs/Sakhi%20%E2%80%94%20Data%20Model%20%26%20RLS%20Schema%209d3d017502604f09933eedfcde9e5020.md)
- [AI Prompt & Safety Design](./docs/Sakhi%20%E2%80%94%20AI%20Prompt%20%26%20Safety%20Design%20bfec109c9fea42a5bc691248f6be3e16.md)
- [MVP Project Brief](./docs/Sakhi%20%E2%80%94%20Women's%20Health%20Companion%20(MVP%20Project%20Brie%20754abe0d3d124992a7fc00d2e6e00727.md)

Research material is available under [`docs/research/`](./docs/research/).

---

## Why the project is structured this way

Sakhi is intentionally split into two conceptual layers:

**The product layer** focuses on making daily health reflection pleasant enough to use consistently.

**The trust layer** focuses on being honest about what the system knows, where information comes from, how user data should be isolated, and when an AI assistant should step aside for professional care.

That separation is important for a health-oriented product: a beautiful interface is useful, but the system's boundaries and data practices matter just as much.

---

## Status

Sakhi is an evolving MVP/prototype with a substantial frontend implementation and a detailed production architecture documented alongside it.

The current priority is moving from the polished local experience toward the documented backend, AI, RAG, privacy, and safety architecture while keeping the product's calm, human-centered interaction model intact.
