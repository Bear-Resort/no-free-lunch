# No Free Lunch — Agent Instructions

Durable guidance for Codex and other coding agents. Keep this file short; put detail in `.agents/rules/`, `.agents/skills/`, and `docs/`.

## Product

Turn-based game web app. **Game rules live in `.agents/rules/game-rules.md`** (settled). Follow that file; ask before changing rules.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React components |
| Styles | Tailwind CSS |
| Primitives | shadcn/ui |
| Backend | Convex (queries, mutations, actions, realtime) |

## Design (non-negotiable)

1. **Modern, simplified** UI — clear hierarchy, low clutter.
2. **Theme**: dark blue as the main theme (surfaces, accents, atmosphere).
3. **Popups / modals**: Gaussian blur backdrop (`backdrop-blur`); use popups when the flow needs focus (mode select, room code, confirmations, turn prompts).
4. **Motion**: moderate animations on shadcn components; every async path needs an explicit **loading state**.
5. Prefer one job per screen/section; avoid dashboard clutter on game surfaces.

## Game modes (backend + UX)

1. **Local / same device** — two players, alternate rounds on one client.
2. **Online** — room via shared code, or random matchmaking.
3. **vs Agent** — play against an AI agent (details later).

Implement mode selection and session shaping early; do not invent agent behavior until specified.

## Repo layout (target)

```text
/
├── AGENTS.md                 # this file (auto-loaded by Codex)
├── README.md                 # human overview
├── docs/                     # product + design (human + agent)
├── .agents/
│   ├── rules/                # durable agent rules (incl. game rules)
│   └── skills/               # Codex skills
├── src/                      # React app (or app/ if Next.js)
│   ├── components/ui/        # shadcn
│   ├── components/game/      # game UI
│   └── lib/
└── convex/                   # Convex schema + functions
```

Scaffold the app when implementation starts; match this layout unless the user chooses a different React meta-framework.

## Commands

```bash
npm install
cp .env.sample .env.local   # fill after `npx convex dev`
npm run dev                 # Vite frontend
npm run dev:backend         # npx convex dev — never deploy for local work
npm test
npm run typecheck
```

**Online capacity:** max **15** concurrent waiting+active games (`convex/lib/capacity.ts`). Over capacity → busy; suggest Assayer.

## Architecture note

The pure game engine lives in `convex/engine/` (zero Convex/DOM imports) so the
same code runs in the client, tests, and future Convex functions. Client
imports it via the `@engine/*` alias. Key invariant, enforced by tests: the
true gold layout is always consistent with all public evidence
(`tests/engine/solver.test.ts`).

## Boundaries

**Always**

- Read `.agents/rules/game-rules.md`, `docs/product-vision.md`, and `docs/design-system.md` before game or UI work.
- Follow other files under `.agents/rules/` when relevant.
- Use skills under `.agents/skills/` when the task matches (frontend, Convex, game modes).
- Validate Convex public function `args` and `returns`; auth-check user data.
- Use `npx convex dev` for development (not `npx convex deploy`).

**Ask first**

- Changing stack, theme tokens, mode model, or game rules.
- Adding dependencies outside React / Tailwind / shadcn / Convex.

**Never**

- Invent mechanics that contradict `.agents/rules/game-rules.md`.
- Invent agent strategy.
- Ship popups without blur + loading states.
- Use light/cream or purple default AI aesthetics instead of dark blue.
- Commit secrets or `.env.local` values.
- Put agent rules under `.cursor/` — use `.agents/` only.

## Skills

| Skill | When |
|-------|------|
| `$nfl-frontend` | UI, theme, popups, shadcn, animations, loading |
| `$nfl-convex` | schema, queries/mutations, realtime, rooms |
| `$nfl-game-modes` | local / online / agent mode wiring |

## Done when

- Matches dark-blue + blur-popup design system
- Mode entry points exist or are stubbed without fake rules
- Gameplay matches `.agents/rules/game-rules.md`
- Convex functions are typed/validated
- Lint/typecheck pass once tooling exists
