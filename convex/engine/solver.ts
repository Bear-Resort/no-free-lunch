// The deduction core. Enumerates every distinct layout expressible as a
// formula over a set of maps (layout-space BFS with dedupe — thousands of
// boards, not millions of expressions), then filters by public evidence.
// Powers the AI opponent, the insight heatmap, and attempt legality.

import {
  type BB,
  CELLS,
  bbCount,
  bbFromKey,
  bbGet,
  bbKey,
  bbXor,
} from "./bitboard";
import { OPS, type Op, applyOp } from "./formula";
import type { Step } from "./program";
import { type Bucket, type Game, feedback, revealedMaps } from "./rules";

export interface LayoutInfo {
  bb: BB;
  cost: number; // minimum machine uses to build it
  parent?: { op: Op; a: string; b: string }; // witness combination (keys)
}

/**
 * All distinct layouts buildable from `maps` with at most `maxOps` ops.
 * Keyed by bbKey. Each entry keeps a minimal-cost witness for program replay.
 */
export function enumerateLayouts(
  maps: BB[],
  maxOps: number,
): Map<string, LayoutInfo> {
  const all = new Map<string, LayoutInfo>();
  const byCost: string[][] = [];
  const add = (bb: BB, cost: number, parent?: LayoutInfo["parent"]) => {
    const k = bbKey(bb);
    if (all.has(k)) return;
    all.set(k, { bb, cost, parent });
    (byCost[cost] ??= []).push(k);
  };

  for (const m of maps) add(m, 0);

  for (let cost = 1; cost <= maxOps; cost++) {
    for (let i = 0; i <= cost - 1 - i; i++) {
      const j = cost - 1 - i;
      const as = byCost[i] ?? [];
      const bs = byCost[j] ?? [];
      for (let ai = 0; ai < as.length; ai++) {
        // Ops are commutative: when combining within one level, skip mirrored pairs.
        const start = i === j ? ai : 0;
        for (let bi = start; bi < bs.length; bi++) {
          const a = all.get(as[ai])!.bb;
          const b = all.get(bs[bi])!.bb;
          for (const op of OPS) {
            add(applyOp(op, a, b), cost, { op, a: as[ai], b: bs[bi] });
          }
        }
      }
    }
  }
  return all;
}

export interface Evidence {
  drills: { cell: number; gold: boolean }[];
  failedAttempts: { bb: BB; bucket: Bucket }[];
  goldMin: number;
  goldMax: number;
  /** Layout keys known not to be the truth (e.g. the raw maps, per guardrails). */
  notKeys: Set<string>;
}

/** Everything both players publicly know, extracted from the game log. */
export function evidenceFromGame(g: Game): Evidence {
  const drills: Evidence["drills"] = [];
  const failedAttempts: Evidence["failedAttempts"] = [];
  for (const r of g.log) {
    if (r.action === "drill") {
      drills.push({ cell: r.cell!, gold: r.struckGold! });
    } else if (!r.correct && r.attemptKey && r.bucket) {
      failedAttempts.push({ bb: bbFromKey(r.attemptKey), bucket: r.bucket });
    }
  }
  // Guardrail knowledge is public: truth never equals a single map.
  const notKeys = new Set(revealedMaps(g).map(bbKey));
  return {
    drills,
    failedAttempts,
    goldMin: g.variant.goldMin,
    goldMax: g.variant.goldMax,
    notKeys,
  };
}

export function isConsistent(bb: BB, ev: Evidence): boolean {
  const n = bbCount(bb);
  if (n < ev.goldMin || n > ev.goldMax) return false;
  if (ev.notKeys.has(bbKey(bb))) return false;
  for (const d of ev.drills) {
    if (bbGet(bb, d.cell) !== d.gold) return false;
  }
  for (const f of ev.failedAttempts) {
    const wrong = bbCount(bbXor(bb, f.bb));
    if (wrong === 0) return false; // that exact layout already failed
    if (feedback(wrong) !== f.bucket) return false;
  }
  return true;
}

export interface SolverView {
  /** Layouts buildable from revealed maps that fit all public evidence. */
  candidates: BB[];
  /** Full enumeration (for witness/program lookup). */
  layouts: Map<string, LayoutInfo>;
}

/**
 * The player-legal view: hypotheses constructible from *revealed* maps that
 * fit the evidence. Before all maps are revealed the truth may live outside
 * this set (it can require unrevealed maps) — that's the game.
 */
export function solve(g: Game): SolverView {
  const layouts = enumerateLayouts(revealedMaps(g), g.variant.maxOps);
  const ev = evidenceFromGame(g);
  const candidates: BB[] = [];
  for (const info of layouts.values()) {
    if (isConsistent(info.bb, ev)) candidates.push(info.bb);
  }
  return { candidates, layouts };
}

/** Fraction of candidates containing gold at each cell. */
export function cellProbabilities(candidates: BB[]): number[] {
  const probs = Array(CELLS).fill(0) as number[];
  if (candidates.length === 0) return probs;
  for (const c of candidates) {
    for (let cell = 0; cell < CELLS; cell++) {
      if (bbGet(c, cell)) probs[cell] += 1;
    }
  }
  return probs.map((n) => n / candidates.length);
}

/**
 * Reconstruct a machine program (pool-indexed steps) that builds `key` from
 * the first `revealed` maps, using the BFS witnesses.
 */
export function programFor(
  layouts: Map<string, LayoutInfo>,
  key: string,
  mapKeys: string[],
): Step[] {
  const steps: Step[] = [];
  const index = new Map<string, number>();
  mapKeys.forEach((k, i) => {
    if (!index.has(k)) index.set(k, i);
  });

  const resolve = (k: string): number => {
    const existing = index.get(k);
    if (existing !== undefined) return existing;
    const info = layouts.get(k);
    if (!info?.parent) throw new Error("no witness for layout");
    const a = resolve(info.parent.a);
    const b = resolve(info.parent.b);
    steps.push({ op: info.parent.op, a, b });
    const poolIndex = mapKeys.length + steps.length - 1;
    index.set(k, poolIndex);
    return poolIndex;
  };

  resolve(key);
  return steps;
}
