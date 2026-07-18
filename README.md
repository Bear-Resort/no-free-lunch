# No Free Lunch

Turn-based game web app. Frontend is React + Tailwind + shadcn; backend is Convex. Three play modes: local same-device, online (room code or random match), and vs agent.

> **Agents (Codex-first):** [`AGENTS.md`](./AGENTS.md) · rules in [`.agents/rules/`](./.agents/rules/) · skills in [`.agents/skills/`](./.agents/skills/)

## Status

**Playable.** Engine + exact solver + local pass-and-play + **vs The Assayer** (solver-backed AI that narrates true deductions) are live. Online rooms/matchmaking via Convex are next.

```bash
npm install
npm run dev        # play at localhost:5173
npm test           # 18 engine/solver tests
npm run typecheck
```

Demo deep links (seeded, reproducible): `/?play=lunch&seed=JUDGES-1` (quick variant) · add `&vs=agent` to face The Assayer.

### Why the AI can't lie

The secret formula space is exactly enumerable (layout-space BFS over bitboards, deduped — thousands of boards, not millions of expressions). The Assayer maintains every hypothesis consistent with public evidence and narrates only those facts — the narration is derived from an exact solver, so it cannot hallucinate the game. See [convex/engine/solver.ts](convex/engine/solver.ts).

## Intended structure

```text
no-free-lunch/
├── AGENTS.md                      # Codex entrypoint (keep concise)
├── README.md                      # this file
├── docs/
│   ├── product-vision.md          # modes, product goals
│   ├── design-system.md           # theme, popups, motion
│   └── game-rules.md              # pointer → .agents/rules/game-rules.md
├── .agents/
│   ├── rules/                     # durable agent rules (canonical)
│   │   ├── game-rules.md
│   │   ├── project-vision.md
│   │   ├── frontend-design.md
│   │   └── convex-backend.md
│   └── skills/                    # Codex skills
│       ├── nfl-frontend/
│       ├── nfl-convex/
│       └── nfl-game-modes/
├── src/                           # React app (scaffold when building)
│   ├── components/
│   │   ├── ui/                    # shadcn primitives
│   │   └── game/                  # game-specific UI
│   ├── hooks/
│   ├── lib/
│   └── styles/
└── convex/                        # Convex schema + functions
    ├── schema.ts
    ├── games.ts
    ├── rooms.ts
    └── ...
```

## Stack

| Concern | Choice |
|---------|--------|
| Components | React |
| Styling | Tailwind CSS |
| UI kit | shadcn/ui |
| Backend / realtime | Convex |

## Design targets

- Modern, simplified UI
- **Dark blue** main theme
- Dialogs/popups with **Gaussian blur** backdrops
- Use popups when the flow needs modal focus
- Moderate animations on shadcn pieces
- Explicit loading states for async UI

Details: [`docs/design-system.md`](./docs/design-system.md).

## Game modes

1. **Local** — two players on the same device, alternating rounds
2. **Online** — join via shared room code, or random pair
3. **vs Agent** — human vs AI (behavior TBD)

Details: [`docs/product-vision.md`](./docs/product-vision.md).

## Agent setup (Codex)

| File / path | Purpose |
|-------------|---------|
| `AGENTS.md` | Auto-loaded by Codex; short durable rules |
| `.agents/rules/*` | Game rules + project/frontend/Convex rules |
| `.agents/skills/*` | Invokable skills (`$nfl-frontend`, etc.) |
| `docs/*` | Product vision & design system (plus pointers) |

Clone the repo on any machine — agents pick up the same vision from these committed files. **Do not use `.cursor/` for rules** — keep agent memory under `.agents/`.

### Useful skill triggers

- UI / theme / modals → `$nfl-frontend`
- Convex schema, rooms, matchmaking → `$nfl-convex`
- Mode selection and session model → `$nfl-game-modes`

## Development (after scaffold)

```bash
npm install
npx convex dev    # development only — do not use deploy for local work
npm run dev
```

## Game rules

Canonical: [`.agents/rules/game-rules.md`](./.agents/rules/game-rules.md).

## Next

1. Scaffold React + Tailwind + shadcn + Convex
2. Implement mode shells and UI chrome against the design system
3. Encode `.agents/rules/game-rules.md` into Convex + client turn / machine UI
