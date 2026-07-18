import { type BB, bbAnd, bbOr, bbXor } from "./bitboard";

export type Op = "AND" | "OR" | "XOR";
export const OPS: Op[] = ["AND", "OR", "XOR"];

/** Secret formula: a binary expression tree over map indices. */
export type Expr = { map: number } | { op: Op; l: Expr; r: Expr };

export function applyOp(op: Op, a: BB, b: BB): BB {
  return op === "AND" ? bbAnd(a, b) : op === "OR" ? bbOr(a, b) : bbXor(a, b);
}

export function evalExpr(e: Expr, maps: BB[]): BB {
  if ("map" in e) return maps[e.map];
  return applyOp(e.op, evalExpr(e.l, maps), evalExpr(e.r, maps));
}

export function opCount(e: Expr): number {
  return "map" in e ? 0 : 1 + opCount(e.l) + opCount(e.r);
}

export function countOp(e: Expr, op: Op): number {
  if ("map" in e) return 0;
  return (e.op === op ? 1 : 0) + countOp(e.l, op) + countOp(e.r, op);
}

export function usedMaps(e: Expr, into: Set<number> = new Set()): Set<number> {
  if ("map" in e) into.add(e.map);
  else {
    usedMaps(e.l, into);
    usedMaps(e.r, into);
  }
  return into;
}

/** Human-readable form, e.g. "(M1 XOR M3) OR M5". */
export function formulaText(e: Expr): string {
  if ("map" in e) return `M${e.map + 1}`;
  const side = (x: Expr) => ("map" in x ? formulaText(x) : `(${formulaText(x)})`);
  return `${side(e.l)} ${e.op} ${side(e.r)}`;
}
