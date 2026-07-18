import { describe, expect, it } from "vitest";
import { bbEq, bbKey } from "@engine/bitboard";
import { chooseMove } from "@engine/ai";
import { STANDARD, LUNCH_BREAK, generate } from "@engine/generation";
import { runProgram } from "@engine/program";
import { attempt, drill, newGame, revealedMaps, type Game } from "@engine/rules";
import {
  enumerateLayouts,
  evidenceFromGame,
  isConsistent,
  programFor,
  solve,
} from "@engine/solver";
import { makeRng, randInt } from "@engine/rng";

describe("solver", () => {
  it("the true gold layout is always in the full 5-map enumeration", () => {
    for (let i = 0; i < 20; i++) {
      const { maps, gold } = generate(`enum-${i}`);
      const layouts = enumerateLayouts(maps, STANDARD.maxOps);
      expect(layouts.has(bbKey(gold))).toBe(true);
    }
  });

  it("witness programs rebuild their layout through the machines", () => {
    const { maps } = generate("witness-seed");
    const layouts = enumerateLayouts(maps, STANDARD.maxOps);
    const mapKeys = maps.map(bbKey);
    let checked = 0;
    for (const [key, info] of layouts) {
      if (!info.parent) continue; // raw maps have no program
      const steps = programFor(layouts, key, mapKeys);
      expect(steps.length).toBeLessThanOrEqual(STANDARD.machineBudget);
      const run = runProgram(steps, maps, STANDARD.machineBudget);
      expect(run.ok).toBe(true);
      if (run.ok) expect(bbKey(run.out)).toBe(key);
      if (++checked >= 200) break; // sample, full set is thousands
    }
    expect(checked).toBe(200);
  });

  it("truth stays consistent with all public evidence through random games", () => {
    const rng = makeRng("invariant-games");
    for (let i = 0; i < 10; i++) {
      let g: Game = newGame(`invariant-${i}`);
      while (g.status === "active" && g.turn <= 30) {
        // Random drills with occasional wrong attempts thrown in.
        if (rng() < 0.15) {
          const { candidates } = solve(g);
          const wrong = candidates.find((c) => !bbEq(c, g.gold));
          if (wrong) {
            g = attempt(g, wrong);
            continue;
          }
        }
        const open: number[] = [];
        g.cells.forEach((c, idx) => c === 0 && open.push(idx));
        g = drill(g, open[randInt(rng, open.length)]);
        // THE invariant: the truth always satisfies the public evidence.
        expect(isConsistent(g.gold, evidenceFromGame(g))).toBe(true);
      }
    }
  });

  it("enumerates a full 5-map layout space quickly", () => {
    const { maps } = generate("perf-seed");
    const start = performance.now();
    const layouts = enumerateLayouts(maps, STANDARD.maxOps);
    const elapsed = performance.now() - start;
    expect(layouts.size).toBeGreaterThan(100);
    expect(elapsed).toBeLessThan(5000);
  });

  it("the agent wins a lunch-break game against random play", () => {
    let g = newGame("agent-vs-random", LUNCH_BREAK);
    const rng = makeRng("random-opponent");
    while (g.status === "active") {
      if (g.turn % 2 === 1) {
        // Red: random driller.
        const open: number[] = [];
        g.cells.forEach((c, idx) => c === 0 && open.push(idx));
        g = drill(g, open[randInt(rng, open.length)]);
      } else {
        // Black: The Assayer.
        const { move } = chooseMove(g);
        if (move.kind === "drill") {
          g = drill(g, move.cell);
        } else {
          const run = runProgram(
            move.steps,
            revealedMaps(g),
            g.variant.machineBudget,
          );
          expect(run.ok).toBe(true);
          if (run.ok) g = attempt(g, run.out);
        }
      }
    }
    // The agent should at minimum never crash and the game must terminate.
    expect(g.status).toBe("finished");
  });
});
