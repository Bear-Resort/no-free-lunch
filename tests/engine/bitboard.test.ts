import { describe, expect, it } from "vitest";
import {
  CELLS,
  EMPTY_BB,
  bbAnd,
  bbCount,
  bbEq,
  bbFromKey,
  bbGet,
  bbKey,
  bbOr,
  bbWith,
  bbXor,
  type BB,
} from "@engine/bitboard";
import { makeRng } from "@engine/rng";

function randomBoard(rng: () => number): { bb: BB; cells: boolean[] } {
  let bb: BB = EMPTY_BB;
  const cells = Array(CELLS).fill(false) as boolean[];
  for (let c = 0; c < CELLS; c++) {
    if (rng() < 0.4) {
      bb = bbWith(bb, c);
      cells[c] = true;
    }
  }
  return { bb, cells };
}

describe("bitboard", () => {
  it("matches a naive boolean-array model for AND/OR/XOR/count", () => {
    const rng = makeRng("bitboard-test");
    for (let round = 0; round < 100; round++) {
      const A = randomBoard(rng);
      const B = randomBoard(rng);
      const and = bbAnd(A.bb, B.bb);
      const or = bbOr(A.bb, B.bb);
      const xor = bbXor(A.bb, B.bb);
      for (let c = 0; c < CELLS; c++) {
        expect(bbGet(A.bb, c)).toBe(A.cells[c]);
        expect(bbGet(and, c)).toBe(A.cells[c] && B.cells[c]);
        expect(bbGet(or, c)).toBe(A.cells[c] || B.cells[c]);
        expect(bbGet(xor, c)).toBe(A.cells[c] !== B.cells[c]);
      }
      expect(bbCount(A.bb)).toBe(A.cells.filter(Boolean).length);
    }
  });

  it("round-trips through the string key", () => {
    const rng = makeRng("key-test");
    for (let round = 0; round < 50; round++) {
      const { bb } = randomBoard(rng);
      expect(bbEq(bbFromKey(bbKey(bb)), bb)).toBe(true);
    }
  });
});
