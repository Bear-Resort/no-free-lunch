import { describe, expect, it } from "vitest";
import { bbCount, bbEq } from "@engine/bitboard";
import { countOp, evalExpr, opCount, usedMaps } from "@engine/formula";
import { LUNCH_BREAK, STANDARD, generate } from "@engine/generation";

describe("generation guardrails", () => {
  it("standard: 300 seeds all satisfy every guardrail", () => {
    for (let i = 0; i < 300; i++) {
      const { maps, formula, gold } = generate(`std-${i}`, STANDARD);
      const n = bbCount(gold);
      expect(n).toBeGreaterThanOrEqual(STANDARD.goldMin);
      expect(n).toBeLessThanOrEqual(STANDARD.goldMax);
      expect(bbEq(evalExpr(formula, maps), gold)).toBe(true);
      expect(opCount(formula)).toBeLessThanOrEqual(STANDARD.maxOps);
      expect(opCount(formula)).toBeGreaterThanOrEqual(STANDARD.minOps);
      expect(countOp(formula, "XOR")).toBeLessThanOrEqual(STANDARD.maxXor);
      const used = usedMaps(formula);
      expect(used.size).toBeGreaterThanOrEqual(2);
      expect([...used].some((m) => m > 0)).toBe(true);
      for (const m of maps) expect(bbEq(m, gold)).toBe(false);
    }
  });

  it("lunch break: 100 seeds satisfy the demo-variant guardrails", () => {
    for (let i = 0; i < 100; i++) {
      const { maps, formula, gold } = generate(`lunch-${i}`, LUNCH_BREAK);
      const n = bbCount(gold);
      expect(n).toBeGreaterThanOrEqual(LUNCH_BREAK.goldMin);
      expect(n).toBeLessThanOrEqual(LUNCH_BREAK.goldMax);
      expect(maps).toHaveLength(3);
      expect(opCount(formula)).toBeLessThanOrEqual(2);
      for (const m of maps) expect(bbEq(m, gold)).toBe(false);
    }
  });

  it("is deterministic per seed", () => {
    const a = generate("same-seed");
    const b = generate("same-seed");
    expect(bbEq(a.gold, b.gold)).toBe(true);
    expect(a.maps.every((m, i) => bbEq(m, b.maps[i]))).toBe(true);
  });
});
