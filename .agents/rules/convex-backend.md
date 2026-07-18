# Convex backend (agent rule)

Apply when working under `convex/`.

- Support modes: `local`, `online` (room code + random), `agent` (stub)
- Validate `args` and `returns` on public functions; await all promises
- Auth-check user data; index queries; no `Date.now()` in queries
- Dev with `npx convex dev` only
- Prefer `$nfl-convex` and `$nfl-game-modes` skills for larger changes
- Gameplay logic must match `.agents/rules/game-rules.md`
