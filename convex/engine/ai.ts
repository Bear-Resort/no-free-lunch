// The Assayer — solver-backed opponent policy. It only ever uses public
// information (revealed maps + the public log), so it plays by the same
// rules as a human; every move it proposes is validated by the same reducer.

import { type BB, CELLS, bbGet, bbKey } from "./bitboard";
import type { Step } from "./program";
import { type Game, revealedCount, revealedMaps } from "./rules";
import { cellProbabilities, programFor, solve } from "./solver";

export type AgentMove =
  | { kind: "drill"; cell: number }
  | { kind: "attempt"; steps: Step[]; layout: BB };

export interface AgentDecision {
  move: AgentMove;
  /** Telemetry for narration — true solver facts, safe to hand to an LLM. */
  telemetry: {
    candidates: number;
    allMapsRevealed: boolean;
    reason: string;
    cellProb?: number;
  };
}

export function chooseMove(g: Game): AgentDecision {
  const { candidates, layouts } = solve(g);
  const allRevealed = revealedCount(g) === g.variant.maps;
  const mapKeys = revealedMaps(g).map(bbKey);
  const drillable = (cell: number) => g.cells[cell] === 0;

  // Certain win: all maps revealed and exactly one hypothesis fits everything.
  // Late-game gamble: ≤2 hypotheses near the turn cap.
  const turnsLeft = g.variant.turnCap - g.turn + 1;
  const shouldSubmit =
    candidates.length === 1
      ? allRevealed || turnsLeft <= 6
      : candidates.length === 2 && turnsLeft <= 4;

  if (shouldSubmit) {
    const layout = candidates[0];
    const steps = programFor(layouts, bbKey(layout), mapKeys);
    if (steps.length > 0 && steps.length <= g.variant.machineBudget) {
      return {
        move: { kind: "attempt", steps, layout },
        telemetry: {
          candidates: candidates.length,
          allMapsRevealed: allRevealed,
          reason:
            candidates.length === 1 && allRevealed
              ? "unique consistent layout — certain win"
              : "gambling on the best remaining hypothesis before the cap",
        },
      };
    }
  }

  // Otherwise drill. With a live hypothesis set: prefer near-certain gold
  // (points), else the cell that best splits the hypotheses (information).
  if (candidates.length >= 2) {
    const probs = cellProbabilities(candidates);
    let greedy = -1;
    let split = -1;
    let bestP = 0;
    let bestSplit = Infinity;
    for (let cell = 0; cell < CELLS; cell++) {
      if (!drillable(cell)) continue;
      const p = probs[cell];
      if (p > bestP) {
        bestP = p;
        greedy = cell;
      }
      const d = Math.abs(p - 0.5);
      if (d < bestSplit) {
        bestSplit = d;
        split = cell;
      }
    }
    if (bestP >= 0.85 && greedy >= 0) {
      return {
        move: { kind: "drill", cell: greedy },
        telemetry: {
          candidates: candidates.length,
          allMapsRevealed: allRevealed,
          reason: "near-certain gold under every surviving hypothesis",
          cellProb: bestP,
        },
      };
    }
    if (split >= 0 && bestSplit < 0.5) {
      return {
        move: { kind: "drill", cell: split },
        telemetry: {
          candidates: candidates.length,
          allMapsRevealed: allRevealed,
          reason: "this drill splits the surviving hypotheses most evenly",
          cellProb: probs[split],
        },
      };
    }
  }

  // No usable hypothesis set yet: drill by overlap of revealed maps
  // (cells marked on more revealed maps are likelier gold).
  const revealed = revealedMaps(g);
  let best = -1;
  let bestWeight = -1;
  for (let cell = 0; cell < CELLS; cell++) {
    if (!drillable(cell)) continue;
    let w = 0;
    for (const m of revealed) if (bbGet(m, cell)) w += 1;
    if (w > bestWeight) {
      bestWeight = w;
      best = cell;
    }
  }
  return {
    move: { kind: "drill", cell: best },
    telemetry: {
      candidates: candidates.length,
      allMapsRevealed: allRevealed,
      reason: "no complete theory fits yet — prospecting where revealed maps agree",
    },
  };
}
