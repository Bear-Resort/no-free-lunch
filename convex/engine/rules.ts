import { type BB, CELLS, bbCount, bbEq, bbGet, bbKey, bbXor } from "./bitboard";
import type { Expr } from "./formula";
import { type Generated, type Variant, STANDARD, generate } from "./generation";

export type Seat = "red" | "black";
export const GOLD_POINTS = 3;

export type Bucket = "HOT" | "WARM" | "COLD";

/** Public temperature readout for a failed attempt (never the exact count). */
export function feedback(wrongCells: number): Bucket {
  return wrongCells <= 5 ? "HOT" : wrongCells <= 15 ? "WARM" : "COLD";
}

export interface TurnRecord {
  turn: number;
  seat: Seat;
  action: "drill" | "attempt";
  // drill
  cell?: number;
  struckGold?: boolean;
  // attempt (attemptKey is the submitted layout — kept for solver/replay;
  // UI must only surface bucket/correct to the opponent)
  attemptKey?: string;
  bucket?: Bucket;
  correct?: boolean;
}

export interface Game {
  seed: string;
  variant: Variant;
  // Secret state — never send maps beyond revealedCount, formula, or gold to a client.
  maps: BB[];
  formula: Expr;
  gold: BB;
  goldTotal: number;
  // Public state
  turn: number; // 1-based, the turn about to be played
  scores: Record<Seat, number>;
  cells: (0 | 1 | 2)[]; // 81 cells: 0 undrilled, 1 red, 2 black
  goldFound: number;
  log: TurnRecord[];
  status: "active" | "finished";
  winner?: Seat | "tie";
  winReason?: "map" | "score" | "cap" | "forfeit";
}

export function newGame(seed: string, variant: Variant = STANDARD): Game {
  const gen: Generated = generate(seed, variant);
  return {
    seed,
    variant,
    maps: gen.maps,
    formula: gen.formula,
    gold: gen.gold,
    goldTotal: bbCount(gen.gold),
    turn: 1,
    scores: { red: 0, black: 0 },
    cells: Array(CELLS).fill(0) as (0 | 1 | 2)[],
    goldFound: 0,
    log: [],
    status: "active",
  };
}

export const seatForTurn = (turn: number): Seat =>
  turn % 2 === 1 ? "red" : "black";

/** How many maps are revealed at the given game state. */
export function revealedCount(g: Game): number {
  const completed = g.turn - 1;
  return g.variant.revealAfter.filter((t) => completed >= t).length;
}

export function revealedMaps(g: Game): BB[] {
  return g.maps.slice(0, revealedCount(g));
}

function winnerByScore(g: Game): Seat | "tie" {
  if (g.scores.red > g.scores.black) return "red";
  if (g.scores.black > g.scores.red) return "black";
  return "tie";
}

function clone(g: Game): Game {
  return {
    ...g,
    scores: { ...g.scores },
    cells: [...g.cells],
    log: [...g.log],
  };
}

/** Advance to the next turn, ending the game on all-gold-found or turn cap. */
function advance(g: Game): void {
  if (g.goldFound === g.goldTotal) {
    g.status = "finished";
    g.winner = winnerByScore(g);
    g.winReason = "score";
    return;
  }
  if (g.turn >= g.variant.turnCap) {
    g.status = "finished";
    g.winner = winnerByScore(g);
    g.winReason = "cap";
    return;
  }
  g.turn += 1;
}

export function drill(g: Game, cell: number): Game {
  if (g.status !== "active") throw new Error("game is finished");
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) {
    throw new Error("cell out of range");
  }
  if (g.cells[cell] !== 0) throw new Error("cell already drilled");

  const out = clone(g);
  const seat = seatForTurn(out.turn);
  const struckGold = bbGet(out.gold, cell);
  out.cells[cell] = seat === "red" ? 1 : 2;
  if (struckGold) {
    out.scores[seat] += GOLD_POINTS;
    out.goldFound += 1;
  }
  out.log.push({ turn: out.turn, seat, action: "drill", cell, struckGold });
  advance(out);
  return out;
}

/** Submit a full candidate layout (already validated as a legal machine output). */
export function attempt(g: Game, layout: BB): Game {
  if (g.status !== "active") throw new Error("game is finished");

  const out = clone(g);
  const seat = seatForTurn(out.turn);
  const correct = bbEq(layout, out.gold);
  const record: TurnRecord = {
    turn: out.turn,
    seat,
    action: "attempt",
    attemptKey: bbKey(layout),
    correct,
  };
  if (correct) {
    out.log.push(record);
    out.status = "finished";
    out.winner = seat;
    out.winReason = "map";
    return out;
  }
  record.bucket = feedback(bbCount(bbXor(layout, out.gold)));
  out.log.push(record);
  advance(out);
  return out;
}
