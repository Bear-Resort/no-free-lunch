import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Hard cap on concurrent online games (waiting + active). Protects Convex budget. */
export const MAX_ACTIVE_ONLINE_GAMES = 15;

export const BUSY_MESSAGE =
  "Server is busy — at most 15 online games can run at once. Play against the Assayer while you wait.";

type DbCtx = QueryCtx | MutationCtx;

/** Count games that occupy a capacity slot. */
export async function countActiveOnlineGames(ctx: DbCtx): Promise<number> {
  const waiting = await ctx.db
    .query("onlineGames")
    .withIndex("by_status", (q) => q.eq("status", "waiting"))
    .collect();
  const active = await ctx.db
    .query("onlineGames")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .collect();
  return waiting.length + active.length;
}

export async function assertCanCreateOnlineGame(ctx: MutationCtx): Promise<void> {
  const n = await countActiveOnlineGames(ctx);
  if (n >= MAX_ACTIVE_ONLINE_GAMES) {
    throw new Error(BUSY_MESSAGE);
  }
}
