import { describe, expect, it } from "vitest";
import { CELLS, bbGet, bbWith, bbXor, EMPTY_BB, type BB } from "@engine/bitboard";
import {
  attempt,
  drill,
  feedback,
  newGame,
  revealedCount,
  seatForTurn,
  type Game,
} from "@engine/rules";

/** Drill the first undrilled cell (any legal move) to advance the turn. */
function anyDrill(g: Game): Game {
  const cell = g.cells.findIndex((c) => c === 0);
  return drill(g, cell);
}

describe("rules", () => {
  it("alternates seats starting with red", () => {
    expect(seatForTurn(1)).toBe("red");
    expect(seatForTurn(2)).toBe("black");
    expect(seatForTurn(7)).toBe("red");
  });

  it("reveals maps at start and after turns 7/14/21/28", () => {
    let g = newGame("reveal-test");
    expect(revealedCount(g)).toBe(1);
    for (let i = 0; i < 6; i++) g = anyDrill(g);
    expect(revealedCount(g)).toBe(1); // 6 turns completed
    g = anyDrill(g); // turn 7 completes
    expect(revealedCount(g)).toBe(2);
    for (let i = 0; i < 7; i++) g = anyDrill(g);
    expect(revealedCount(g)).toBe(3);
  });

  it("scores +3 for gold drills and fills the driller's color", () => {
    let g = newGame("score-test");
    const goldCell = Array.from({ length: CELLS }, (_, i) => i).find((c) =>
      bbGet(g.gold, c),
    )!;
    g = drill(g, goldCell);
    expect(g.scores.red).toBe(3);
    expect(g.cells[goldCell]).toBe(1);
    expect(g.goldFound).toBe(1);
    expect(() => drill(g, goldCell)).toThrow(/already drilled/);
  });

  it("correct map attempt wins immediately", () => {
    let g = newGame("attempt-win");
    g = anyDrill(g); // red drills
    g = attempt(g, g.gold); // black submits the truth
    expect(g.status).toBe("finished");
    expect(g.winner).toBe("black");
    expect(g.winReason).toBe("map");
  });

  it("incorrect attempt yields a temperature bucket and advances the turn", () => {
    let g = newGame("attempt-miss");
    const wrong = bbXor(g.gold, bbWith(EMPTY_BB, 0) as BB);
    const before = g.turn;
    g = attempt(g, bbGet(g.gold, 0) ? wrong : bbWith(g.gold, 0));
    expect(g.status).toBe("active");
    expect(g.turn).toBe(before + 1);
    const rec = g.log[g.log.length - 1];
    expect(rec.correct).toBe(false);
    expect(rec.bucket).toBe("HOT"); // exactly 1 cell wrong
  });

  it("temperature buckets follow the tuned thresholds", () => {
    expect(feedback(1)).toBe("HOT");
    expect(feedback(5)).toBe("HOT");
    expect(feedback(6)).toBe("WARM");
    expect(feedback(15)).toBe("WARM");
    expect(feedback(16)).toBe("COLD");
  });

  it("ends by score when all gold is found", () => {
    let g = newGame("score-end");
    // Drill every gold cell (turn order alternates, both collect).
    while (g.status === "active") {
      const goldCell = Array.from({ length: CELLS }, (_, i) => i).find(
        (c) => g.cells[c] === 0 && bbGet(g.gold, c),
      );
      g = drill(g, goldCell!);
    }
    expect(g.winReason).toBe("score");
    expect(g.goldFound).toBe(g.goldTotal);
    expect(["red", "black", "tie"]).toContain(g.winner);
  });

  it("ends at the turn cap with a score winner", () => {
    let g = newGame("cap-end");
    while (g.status === "active") {
      // Drill only empty cells so all-gold-found never triggers first.
      const emptyCell = Array.from({ length: CELLS }, (_, i) => i).find(
        (c) => g.cells[c] === 0 && !bbGet(g.gold, c),
      );
      g = drill(g, emptyCell!);
    }
    expect(g.winReason).toBe("cap");
    expect(g.log).toHaveLength(g.variant.turnCap);
    expect(g.winner).toBe("tie"); // nobody ever drilled gold
  });
});
