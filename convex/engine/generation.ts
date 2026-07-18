import { type BB, EMPTY_BB, SIZE, bbCount, bbEq, bbWith, cellOf } from "./bitboard";
import { type Expr, OPS, countOp, evalExpr, opCount, usedMaps } from "./formula";
import { type Rng, makeRng, randInt } from "./rng";

/** Tunable rule parameters. Guardrails per .agents/rules/game-rules.md. */
export interface Variant {
  name: string;
  maps: number;
  minOps: number;
  maxOps: number;
  maxXor: number;
  goldMin: number;
  goldMax: number;
  /** Map i is revealed once this many turns have completed. */
  revealAfter: number[];
  machineBudget: number;
  turnCap: number;
}

export const STANDARD: Variant = {
  name: "standard",
  maps: 5,
  minOps: 2,
  maxOps: 4,
  maxXor: 2,
  goldMin: 8,
  goldMax: 30,
  revealAfter: [0, 7, 14, 21, 28],
  machineBudget: 5,
  turnCap: 40,
};

/** Short demo variant — "Lunch Break". */
export const LUNCH_BREAK: Variant = {
  name: "lunch-break",
  maps: 3,
  minOps: 1,
  maxOps: 2,
  maxXor: 1,
  goldMin: 6,
  goldMax: 20,
  revealAfter: [0, 5, 10],
  machineBudget: 3,
  turnCap: 20,
};

/** Stamp a plus-shaped "cross" centered at (row, col), clipped at edges. */
function stampCross(b: BB, row: number, col: number): BB {
  let out = bbWith(b, cellOf(row, col));
  if (row > 0) out = bbWith(out, cellOf(row - 1, col));
  if (row < SIZE - 1) out = bbWith(out, cellOf(row + 1, col));
  if (col > 0) out = bbWith(out, cellOf(row, col - 1));
  if (col < SIZE - 1) out = bbWith(out, cellOf(row, col + 1));
  return out;
}

function randomMap(rng: Rng): BB {
  let b: BB = EMPTY_BB;
  const crosses = 3 + randInt(rng, 3); // 3–5 crosses ≈ 15–25% density
  for (let i = 0; i < crosses; i++) {
    b = stampCross(b, randInt(rng, SIZE), randInt(rng, SIZE));
  }
  return b;
}

function randomExpr(rng: Rng, ops: number, mapCount: number): Expr {
  if (ops === 0) return { map: randInt(rng, mapCount) };
  const leftOps = randInt(rng, ops); // remaining ops - 1 split between children
  return {
    op: OPS[randInt(rng, 3)],
    l: randomExpr(rng, leftOps, mapCount),
    r: randomExpr(rng, ops - 1 - leftOps, mapCount),
  };
}

export interface Generated {
  maps: BB[];
  formula: Expr;
  gold: BB;
}

/**
 * Generate maps + secret formula + gold layout, rejecting until all
 * guardrails hold (gold count bounds, no single-map steal, ≥2 distinct maps
 * with one beyond Map 1, limited XOR).
 */
export function generate(seed: string, v: Variant = STANDARD): Generated {
  const rng = makeRng(seed);
  for (let tries = 0; tries < 100_000; tries++) {
    const maps = Array.from({ length: v.maps }, () => randomMap(rng));
    const ops = v.minOps + randInt(rng, v.maxOps - v.minOps + 1);
    const formula = randomExpr(rng, ops, v.maps);
    const gold = evalExpr(formula, maps);

    const n = bbCount(gold);
    if (n < v.goldMin || n > v.goldMax) continue;
    if (countOp(formula, "XOR") > v.maxXor) continue;
    if (opCount(formula) < v.minOps) continue;
    const used = usedMaps(formula);
    if (used.size < 2 || ![...used].some((m) => m > 0)) continue;
    if (maps.some((m) => bbEq(m, gold))) continue;

    return { maps, formula, gold };
  }
  throw new Error(`generation failed for seed "${seed}"`);
}
