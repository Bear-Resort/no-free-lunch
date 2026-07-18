import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Online multiplayer tables.
 * Capacity: at most MAX_ACTIVE_ONLINE_GAMES (see lib/capacity.ts) documents
 * with status "waiting" or "active" may exist at once.
 */
export default defineSchema({
  onlineGames: defineTable({
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("abandoned"),
    ),
    entry: v.union(v.literal("room"), v.literal("random")),
    /** 4-digit code for friend rooms; absent for random-matched games. */
    roomCode: v.optional(v.string()),
    variantName: v.union(v.literal("lunch-break"), v.literal("standard")),
    seed: v.string(),
    /** Unguessable client session ids (not emails). */
    hostPlayerId: v.string(),
    /**
     * Seats after coin flip. While `waiting`, only host is seated as provisional
     * red until the guest joins and the flip assigns both.
     */
    redPlayerId: v.string(),
    blackPlayerId: v.optional(v.string()),
    /** True if the host won Red in the coin flip (set when game becomes active). */
    hostIsRed: v.optional(v.boolean()),
    /** Presence heartbeats — both stale ⇒ abandon (frees a capacity slot). */
    redLastSeenAt: v.optional(v.number()),
    blackLastSeenAt: v.optional(v.number()),
    /** When both seats filled and status became active (forfeit grace). */
    matchedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    /**
     * Full engine Game JSON once both seats are filled (and after moves).
     * Absent while status === "waiting".
     */
    stateJson: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_roomCode", ["roomCode"])
    .index("by_host", ["hostPlayerId"])
    .index("by_status_and_created", ["status", "createdAt"]),

  matchQueue: defineTable({
    playerId: v.string(),
    variantName: v.union(v.literal("lunch-break"), v.literal("standard")),
    createdAt: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_variant_and_created", ["variantName", "createdAt"]),
});
