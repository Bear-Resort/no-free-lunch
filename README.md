# No Free Lunch

Turn-based game web app. Frontend is React + Tailwind + shadcn; backend is Convex. Three play modes: local same-device, online (room code or random match), and vs agent.

> **Agents (Codex-first):** [`AGENTS.md`](./AGENTS.md) · rules in [`.agents/rules/`](./.agents/rules/) · skills in [`.agents/skills/`](./.agents/skills/)

## Status

**Playable.** Engine + exact solver + local pass-and-play + **vs The Assayer** are live. Online lobbies (random / friend 4-digit rooms) are on Convex with a **15-game capacity cap**; shared turn sync over the wire is next.

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

## Development

```bash
cp .env.sample .env.local
npx convex dev          # writes CONVEX_DEPLOYMENT + VITE_CONVEX_URL into .env.local
npm run dev             # Vite
```

Never commit `.env` / `.env.local`. Keep secrets out of git; `.env.sample` is the template.

## GitHub Actions / secrets

Workflows live in [`.github/workflows/`](./.github/workflows/):

| Workflow | When | What |
|----------|------|------|
| `ci.yml` | PR + push | `npm test` + typecheck |
| `deploy.yml` | push to `main` | `npx convex deploy` + production frontend build |

### Secret to add

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Name | Where to get it |
|------|-----------------|
| `CONVEX_DEPLOY_KEY` | [Convex Dashboard](https://dashboard.convex.dev) → your project → **Production** deployment → **Settings → Deploy Keys → Generate Production Deploy Key** (enable `deployment:deploy`) |

That single secret is enough for CI deploy. The action runs:

```bash
npx convex deploy --yes --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

Convex injects the **production** URL into the Vite build; you do **not** need a separate `VITE_CONVEX_URL` GitHub secret for this workflow.

If you host the `dist/` site on Vercel/Netlify instead, either:

- use the same build command + `CONVEX_DEPLOY_KEY` there, or
- set `VITE_CONVEX_URL` to your production Convex URL on that host.

## Game rules

Canonical: [`.agents/rules/game-rules.md`](./.agents/rules/game-rules.md).

## Next

1. Add `CONVEX_DEPLOY_KEY` in GitHub Actions secrets
2. Push to `main` to run CI + Convex production deploy
3. Host the uploaded `dist` artifact (or wire Vercel/Pages) for the public site
