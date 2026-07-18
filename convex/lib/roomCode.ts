import type { MutationCtx } from "../_generated/server";

const DIGITS = "0123456789";

/** Cryptographically weak but fine for short-lived 4-digit lobbies; retries on clash. */
export function randomRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += DIGITS[Math.floor(Math.random() * 10)]!;
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 4) {
    throw new Error("Room code must be exactly 4 digits");
  }
  return digits;
}

/** Allocate a 4-digit code not used by any waiting/active friend room. */
export async function allocateRoomCode(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const code = randomRoomCode();
    const existing = await ctx.db
      .query("onlineGames")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", code))
      .collect();
    const taken = existing.some(
      (g) => g.status === "waiting" || g.status === "active",
    );
    if (!taken) return code;
  }
  throw new Error("Could not allocate a free room code — try again");
}
