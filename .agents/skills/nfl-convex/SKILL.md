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
- Prefer indexes + `withIndex` over `.filter()`
- Await all Convex promises
- Schedule only `internal.*` functions
- No `Date.now()` inside queries
- **Capacity:** at most **15** online games with status `waiting` or `active`. Creating beyond that throws `BUSY_MESSAGE` (tell the user to play vs Assayer). Joining an existing friend room does not create a new slot.

## Online API (`convex/online.ts`)

- `createFriendRoom` → 4-digit `roomCode`, host waits
- `joinFriendRoom` → by code; starts engine state
- `joinRandomQueue` / `leaveRandomQueue` → matchmaking
- `getCapacity` / `getLobby` / `findMyActiveGame` → lobby UI
- `cancelFriendRoom` / `abandonGame` → free slots

Identity: anonymous `playerId` (UUID in localStorage) until full Convex auth is added.

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
