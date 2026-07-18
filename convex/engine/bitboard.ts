// 81-cell board packed into three 32-bit words (32 + 32 + 17 bits).
// Pure module — no Convex, no DOM. Shared by client, server, and tests.

export type BB = readonly [number, number, number];

export const CELLS = 81;
export const SIZE = 9;
export const EMPTY_BB: BB = [0, 0, 0];

export const bbAnd = (a: BB, b: BB): BB => [
  (a[0] & b[0]) >>> 0,
  (a[1] & b[1]) >>> 0,
  (a[2] & b[2]) >>> 0,
];

export const bbOr = (a: BB, b: BB): BB => [
  (a[0] | b[0]) >>> 0,
  (a[1] | b[1]) >>> 0,
  (a[2] | b[2]) >>> 0,
];

export const bbXor = (a: BB, b: BB): BB => [
  (a[0] ^ b[0]) >>> 0,
  (a[1] ^ b[1]) >>> 0,
  (a[2] ^ b[2]) >>> 0,
];

export function bbGet(b: BB, cell: number): boolean {
  return ((b[cell >>> 5] >>> (cell & 31)) & 1) === 1;
}

export function bbWith(b: BB, cell: number): BB {
  const words: [number, number, number] = [b[0], b[1], b[2]];
  words[cell >>> 5] = (words[cell >>> 5] | (1 << (cell & 31))) >>> 0;
  return words;
}

function pc32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >>> 24;
}

export const bbCount = (b: BB): number => pc32(b[0]) + pc32(b[1]) + pc32(b[2]);

export const bbEq = (a: BB, b: BB): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** Stable string key — also the serialization format for storage/network. */
export const bbKey = (b: BB): string => `${b[0]},${b[1]},${b[2]}`;

export function bbFromKey(key: string): BB {
  const [w0, w1, w2] = key.split(",").map(Number);
  return [w0 >>> 0, w1 >>> 0, w2 >>> 0];
}

export const cellOf = (row: number, col: number): number => row * SIZE + col;
