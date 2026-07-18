/**
 * Expire stale lobbies / queue rows / ghost games so capacity slots free up.
 */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { canClaimPresenceForfeit, finishByForfeit, isStale } from "./lib/forfeit";
import { WAITING_HOST_STALE_MS } from "./lib/presence";

/** Waiting rooms older than this are abandoned even with heartbeats. */
const ROOM_TTL_MS = 20 * 60 * 1000;
/** Queue entries older than this are dropped. */
const QUEUE_TTL_MS = 10 * 60 * 1000;

export const sweepStale = internalMutation({
  args: {},
  returns: v.object({
    abandonedRooms: v.number(),
    abandonedActive: v.number(),
    forfeitWins: v.number(),
    clearedQueue: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    let abandonedRooms = 0;
    let abandonedActive = 0;
    let forfeitWins = 0;
    let clearedQueue = 0;

    const waiting = await ctx.db
      .query("onlineGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();

    for (const game of waiting) {
      const hostSeen = game.redLastSeenAt ?? game.createdAt;
      const hostGone = now - hostSeen >= WAITING_HOST_STALE_MS;
      const tooOld = now - game.createdAt >= ROOM_TTL_MS;
      if (hostGone || tooOld) {
        await ctx.db.patch(game._id, {
          status: "abandoned",
          updatedAt: now,
        });
        abandonedRooms += 1;
      }
    }

    const active = await ctx.db
      .query("onlineGames")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const game of active) {
      if (!game.blackPlayerId) continue;
      if (!canClaimPresenceForfeit(game.matchedAt, game.createdAt, now)) {
        continue;
      }
      const redGone = isStale(game.redLastSeenAt, game.createdAt, now);
      const blackGone = isStale(game.blackLastSeenAt, game.createdAt, now);

      if (redGone && blackGone) {
        await ctx.db.patch(game._id, {
          status: "abandoned",
          updatedAt: now,
        });
        abandonedActive += 1;
      } else if (redGone && !blackGone) {
        await finishByForfeit(ctx, game._id, "black", now);
        forfeitWins += 1;
      } else if (blackGone && !redGone) {
        await finishByForfeit(ctx, game._id, "red", now);
        forfeitWins += 1;
      }
    }

    const queue = await ctx.db.query("matchQueue").collect();
    for (const row of queue) {
      if (now - row.createdAt >= QUEUE_TTL_MS) {
        await ctx.db.delete(row._id);
        clearedQueue += 1;
      }
    }

    return { abandonedRooms, abandonedActive, forfeitWins, clearedQueue };
  },
});
