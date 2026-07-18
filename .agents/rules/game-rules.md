# Game rules — No Free Lunch

Source of truth for gameplay. Agents must follow this document.

## Players

- Exactly **2 players** per game.
- Sides: **Red** and **Black** — same rules for both.
- **Red plays first**, then Black, alternating.
- Both players see: all drill outcomes, all map-attempt outcomes, and the board state (including who drilled what).

## Board

- A **9×9** grid (81 cells).
- Each cell is either **gold** or **empty**.
- True gold layout is fixed at game start (see Generation).

### Drilled cell display

- A cell may be drilled **at most once**.
- When drilled, the cell is **filled with the driller’s color** (red or black).
- Whether it had gold is shown **above** the filled square (gold present or not).
- Only the driller scores that gold (**+3** if gold).

## Generation (game start, hidden from players)

Before play begins, the system:

1. Generates **5 maps** (each a 9×9 set of marked “cross” cells).
2. Generates a boolean **combination formula** over those maps using **AND / OR / XOR**, with **at most 4 operators**.
3. Computes the true gold layout as the result of that formula (cell-wise over the maps).
4. Places gold under those coordinates.

Players never see the formula or the unrevealed true map. They only learn about cells by **drilling** or by the outcome of a **map attempt**.

Gold count is whatever the formula produces (random-ish via generation, not a fixed quota), subject to the guardrails below. If a generation fails any guardrail, **regenerate** maps/formula until all hold.

### Generation guardrails (tuned 2026-07-18)

Reject and regenerate unless **all** of these hold:

1. Gold count is between **8 and 30** inclusive (no barren deserts, no floods).
2. The true layout does **not** equal any single map (kills the "submit Map 1 on turn 1" steal — otherwise ~3% of games are stolen before play starts).
3. The formula references at least **2 distinct maps**, at least one of which is Map 2–5.
4. The formula contains at most **2 XOR** operators (long XOR chains are visually opaque to humans).

## Map reveals (system)

- Maps are revealed over time; players may only use **maps revealed so far** in combinations.
- The correct formula may require maps that are not yet revealed — so the winning combination may only become constructible later (often near the end).

| Map | When revealed |
|-----|----------------|
| Map 1 | At game start (before any turns) |
| Map 2 | **After turn 7** completes (round 3.5), before the next turn |
| Map 3 | **After turn 14** completes, before the next turn |
| Map 4 | **After turn 21** completes, before the next turn |
| Map 5 | **After turn 28** completes, before the next turn |

### Turn / round numbering

- **Turn** = one player’s action (drill **or** map attempt).
- **Round** advances by 0.5 per turn (two turns = one full round).

Examples:

| Turn | Player | Round |
|------|--------|-------|
| 1 | Red | 0.5 |
| 2 | Black | 1 |
| 3 | Red | 1.5 |
| 7 | Red (Red’s 4th action) | 3.5 → then Map 2 appears |

At most **5** system maps.

Each revealed map may be **wrong** relative to truth on its own; truth is the formula’s combination of the five maps.

## Turn actions

On a turn the player chooses **exactly one** (not both):

### A. Drill

1. Pick one **undrilled** cell.
2. Reveal immediately: gold or empty (visible to both players).
3. If gold: **+3** to the driller; cell marked with their color + gold indicator.

### B. Map attempt

Costs the **entire turn** (no drill on that turn).

1. Build a candidate map using the **machines** (below), using only **revealed** system maps and any intermediate maps created in this attempt.
2. **Submit the full candidate map**.
3. Outcomes:
   - **Correct** (matches true gold layout) → that player **immediately wins**.
   - **Incorrect** → both players see a public **temperature readout** of how close the attempt was — never cell-level detail, never an exact number:
     - **HOT** — at most 5 cells wrong
     - **WARM** — 6–15 cells wrong
     - **COLD** — more than 15 cells wrong

     The submitted candidate layout itself is **not** shown to the opponent — only the verdict/temperature is public.

## Combination machines (map attempt UI)

Three machines, each taking **2 input maps** and producing **1 output map**:

| Machine | Cell-wise op |
|---------|----------------|
| AND | intersection / both marked |
| OR | union / either marked |
| XOR | exclusive or |

- Inputs may be: any **revealed** system map, or any **intermediate** map produced earlier in this attempt.
- **Power limit:** across one attempt, machines may be used **at most 5 times** total (shared budget for AND + OR + XOR).
- Secret formula uses **≤ 4 operators**; attempts allow up to 5 machine uses so players have a little slack.

## Winning and end of game

1. **Map win** — submit the correct full candidate map → immediate win.
2. **Score win** — when **all gold** on the board has been found (via drills), the player with the **higher score** wins.
3. **Turn cap** — if nobody has won by the end of **turn 40**, the game ends; the player with the higher score wins.
4. **Tie** — if scores are equal at a score-win or turn-cap ending, the game is a **tie** (draw).
5. Score comes only from drilling gold (**+3** each).

## Demo variant — "Lunch Break"

A short mode for demos and first-time players. Same rules except:

| Parameter | Standard | Lunch Break |
|-----------|----------|-------------|
| Maps | 5 | **3** |
| Secret formula | ≤ 4 ops | ≤ **2** ops |
| Reveals | start / after 7 / 14 / 21 / 28 | start / after **5** / **10** |
| Machine budget per attempt | 5 | **3** |
| Turn cap | 40 | **20** |
| Gold count | 8–30 | **6–20** |

---

*Rules settled. Update this file when product decisions change.*
