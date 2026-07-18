# Convex backend (agent rule)

Apply when working under `convex/`.

- Support modes: `local`, `online` (room code + random), `agent`
- Online API in `convex/online.ts`; **max 15** waiting+active games (`lib/capacity.ts`)
- Validate `args` and `returns` on public functions; await all promises
- Index queries; no `Date.now()` in queries (pass `now` from client)
- Online identity: anonymous `playerId` until auth is configured
- Dev with `npx convex dev` only
- Prefer `$nfl-convex` and `$nfl-game-modes` skills for larger changes
- Gameplay logic must match `.agents/rules/game-rules.md`
