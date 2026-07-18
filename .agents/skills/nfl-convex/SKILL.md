---
name: nfl-convex
description: >-
  Implement No Free Lunch Convex backend — schema, validated queries/mutations,
  rooms, matchmaking, and realtime game sessions. Use when working on convex/,
  schema, rooms, matchmaking, auth, or server game state.
---

# NFL Convex

## Stack

- Convex for database, realtime, and server logic
- Development: `npx convex dev` only (never `npx convex deploy` for local work)

## Modes to support in data model

1. **local** — same-device alternating turns
2. **online** — room code join **or** random matchmaking
3. **agent** — human vs agent (agent behavior TBD; store opponent type only until specified)

## Hard requirements

- Public `query` / `mutation` / `action`: define `args` and `returns` validators
- Auth checks for user-owned or multiplayer data via `ctx.auth.getUserIdentity()` (or project auth helpers)
- Prefer indexes + `withIndex` over `.filter()`
- Await all Convex promises
- Schedule only `internal.*` functions
- No `Date.now()` inside queries

## Suggested tables (adjust when rules arrive)

- `games` — mode, status, turn, players, optional roomCode
- `rooms` or room fields on `games` — code, host, open/closed
- `matchQueue` — random pair waiting players (if needed)
- `players` / membership — seat, userId or local seat index

Keep documents flat and relational; index foreign keys and `roomCode`.

## Workflow

1. Read `docs/product-vision.md`.
2. Update `convex/schema.ts` with indexes first.
3. Thin API wrappers; shared logic in plain TS helpers.
4. Expose realtime queries the client can `useQuery` for turn/board state.
5. Stub agent mode without inventing agent moves.

## Do not

- Invent win conditions or agent policy
- Use `.collect()` on unbounded lists without pagination
- Put Node-only code in query/mutation files (`"use node"` actions only)
