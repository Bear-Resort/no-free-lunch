# Product vision

## Goal

Build **No Free Lunch**, a turn-based multiplayer game in the browser with three distinct ways to play, backed by Convex for realtime state.

## Modes

### 1. Local (same device)

- Two human players share one client.
- Players take turns (each player a round).
- No matchmaking; session lives on the device (may still sync to Convex for persistence if useful).

### 2. Online

- Two humans on different devices.
- Entry paths:
  - **Room code** — create/join a shared game room via a short common code.
  - **Random pair** — matchmaking into an available opponent.
- Convex owns room membership, turn ownership, and live updates.

### 3. vs Agent

- One human vs an AI agent.
- Agent behavior, tools, and difficulty are **not specified yet** — wait for further product input before implementing agent logic.
- UI and session shape can stub an `agent` opponent type.

## UX principles

- Mode choice should be obvious from the first screen.
- Prefer **popup windows** for: mode details, room code entry/share, matchmaking wait, confirmations, and turn-critical prompts.
- Keep the in-game board/play surface clean; push secondary flows into blurred modals.

## Core gameplay (summary)

See **[`.agents/rules/game-rules.md`](../.agents/rules/game-rules.md)** for the full rules.

- 2 players (Red first, then Black) on a **9×9** grid.
- At start: generate 5 maps + AND/OR/XOR formula (≤4 ops); gold = formula result.
- Reveal maps over time (start, then after turns 7 / 14 / 21 / 28).
- Turn: **drill** (+3 gold, once per cell, color-fill) **or** **map attempt** (AND/OR/XOR machines, ≤5 uses, submit full map).
- Win: correct map immediately, or higher score when all gold is found.

## Out of scope until specified

- Agent personality, model, or move selection
- Monetization, accounts beyond what Convex auth needs for online play

## Cross-device agent memory

Gameplay source of truth: `.agents/rules/game-rules.md`. Product/modes: this file. Design: `docs/design-system.md`. `AGENTS.md` summarizes; `.agents/rules/` and `.agents/skills/` hold agent memory. Update when decisions change.
