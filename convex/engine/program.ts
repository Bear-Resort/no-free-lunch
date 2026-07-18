import type { BB } from "./bitboard";
import { type Op, applyOp } from "./formula";

/**
 * A machine program for one map attempt. Inputs are pool indices:
 * pool starts as the revealed maps [0..revealed-1]; each step appends its
 * output to the pool, so step i's output has index revealed + i.
 */
export interface Step {
  op: Op;
  a: number;
  b: number;
}

export type ProgramResult =
  | { ok: true; out: BB; pool: BB[] }
  | { ok: false; error: string };

export function runProgram(
  steps: Step[],
  revealed: BB[],
  budget: number,
): ProgramResult {
  if (steps.length === 0) return { ok: false, error: "no machine uses" };
  if (steps.length > budget) {
    return { ok: false, error: `over machine budget (${budget})` };
  }
  const pool = [...revealed];
  for (const s of steps) {
    if (
      !Number.isInteger(s.a) ||
      !Number.isInteger(s.b) ||
      s.a < 0 ||
      s.b < 0 ||
      s.a >= pool.length ||
      s.b >= pool.length
    ) {
      return { ok: false, error: "machine input out of range" };
    }
    pool.push(applyOp(s.op, pool[s.a], pool[s.b]));
  }
  return { ok: true, out: pool[pool.length - 1], pool };
}
