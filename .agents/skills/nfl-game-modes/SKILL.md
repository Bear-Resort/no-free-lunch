---
name: nfl-game-modes
description: >-
  Wire No Free Lunch play modes — local same-device turns, online room code or
  random match, and vs-agent stubs. Use when implementing mode select, lobbies,
  matchmaking, room codes, turn rotation, or session lifecycle.
---

# NFL Game Modes

## Modes

| Mode | Players | Notes |
|------|---------|--------|
| `local` | 2 humans, one device | Alternate rounds; seats on one client |
| `online` | 2 humans, networked | **Room code** create/join **or** **random pair** |
| `agent` | 1 human + agent | Agent logic TBD — stub only |

Gameplay rules: **`.agents/rules/game-rules.md`** (settled). Ask before changing rules. Agent move AI still TBD.

## UX

- First screen: clear mode choice
- Online: popup for create/join code; popup/waiting state for random match
- Use Gaussian-blur popups per `docs/design-system.md`
- Show loading while creating room, joining, or matchmaking

## Session shape (conceptual)

```ts
type GameMode = "local" | "online" | "agent";
type OnlineEntry = "room_code" | "random";

// game: { mode, status, currentTurn, players[], roomCode?, entry? }
```

## Implementation order

1. Mode select UI (popup or dedicated screen)
2. Local session + turn seat switching
3. Online room code create/join via Convex
4. Random matchmaking queue + pair
5. Agent mode stub (`opponent: "agent"`) without move AI

## References

- `.agents/rules/game-rules.md`
- `docs/product-vision.md`
- Skills: `$nfl-frontend`, `$nfl-convex`
