import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  BUSY_MESSAGE,
  MAX_ACTIVE_ONLINE_GAMES,
  assertCanCreateOnlineGame,
  countActiveOnlineGames,
} from "./lib/capacity";
import { bootstrapGame, serializeGame, type VariantName } from "./lib/gameState";
import {
  HEARTBEAT_STALE_MS,
  assignSeats,
  coinFlipHostIsRed,
} from "./lib/presence";
import { canClaimPresenceForfeit, finishByForfeit, isStale } from "./lib/forfeit";
import { allocateRoomCode, normalizeRoomCode } from "./lib/roomCode";

const variantName = v.union(v.literal("lunch-break"), v.literal("standard"));

const playerId = v.string();

function assertPlayerId(id: string): void {
  if (id.length < 16 || id.length > 128) {
    throw new Error("Invalid player id");
  }
}

const lobbyReturn = v.object({
  gameId: v.id("onlineGames"),
  status: v.union(
    v.literal("waiting"),
    v.literal("active"),
    v.literal("finished"),
    v.literal("abandoned"),
  ),
  entry: v.union(v.literal("room"), v.literal("random")),
  roomCode: v.union(v.string(), v.null()),
  variantName,
  seed: v.string(),
  seat: v.union(v.literal("red"), v.literal("black"), v.null()),
  waitingForOpponent: v.boolean(),
  youAreHost: v.boolean(),
  /** Set once both players are in and seats were flipped. */
  hostIsRed: v.union(v.boolean(), v.null()),
  opponentConnected: v.boolean(),
});

export const getCapacity = query({
  args: { now: v.number() },
  returns: v.object({
    active: v.number(),
    max: v.number(),
    busy: v.boolean(),
    message: v.union(v.string(), v.null()),
    checkedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const active = await countActiveOnlineGames(ctx);
    const busy = active >= MAX_ACTIVE_ONLINE_GAMES;
    return {
      active,
      max: MAX_ACTIVE_ONLINE_GAMES,
      busy,
      message: busy ? BUSY_MESSAGE : null,
      checkedAt: args.now,
    };
  },
});

export const getLobby = query({
  args: {
    gameId: v.id("onlineGames"),
    playerId,
    now: v.number(),
  },
  returns: v.union(lobbyReturn, v.null()),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const isRed = game.redPlayerId === args.playerId;
    const isBlack = game.blackPlayerId === args.playerId;
    if (!isRed && !isBlack) return null;

    const oppLast = isRed ? game.blackLastSeenAt : game.redLastSeenAt;
    const opponentConnected =
      game.status === "waiting"
        ? false
        : oppLast !== undefined && args.now - oppLast < HEARTBEAT_STALE_MS;

    return {
      gameId: game._id,
      status: game.status,
      entry: game.entry,
      roomCode: game.roomCode ?? null,
      variantName: game.variantName,
      seed: game.seed,
      seat: isRed ? ("red" as const) : ("black" as const),
      waitingForOpponent: game.status === "waiting" || !game.blackPlayerId,
      youAreHost: game.hostPlayerId === args.playerId,
      hostIsRed: game.hostIsRed ?? null,
      opponentConnected,
    };
  },
});

export const createFriendRoom = mutation({
  args: {
    playerId,
    variantName,
  },
  returns: v.object({
    gameId: v.id("onlineGames"),
    roomCode: v.string(),
  }),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    await assertCanCreateOnlineGame(ctx);

    const roomCode = await allocateRoomCode(ctx);
    const now = Date.now();
    const seed = `${roomCode}-${now.toString(36)}`;

    const gameId = await ctx.db.insert("onlineGames", {
      status: "waiting",
      entry: "room",
      roomCode,
      variantName: args.variantName,
      seed,
      hostPlayerId: args.playerId,
      // Provisional until coin flip when guest joins.
      redPlayerId: args.playerId,
      redLastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { gameId, roomCode };
  },
});

export const joinFriendRoom = mutation({
  args: {
    playerId,
    roomCode: v.string(),
  },
  returns: v.object({
    gameId: v.id("onlineGames"),
    seat: v.union(v.literal("red"), v.literal("black")),
    hostIsRed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const code = normalizeRoomCode(args.roomCode);

    const candidates = await ctx.db
      .query("onlineGames")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", code))
      .collect();

    const game = candidates.find((g) => g.status === "waiting");
    if (!game) {
      throw new Error("No open room with that code");
    }
    if (game.hostPlayerId === args.playerId) {
      throw new Error("You are already in this room");
    }
    if (game.blackPlayerId) {
      throw new Error("Room is already full");
    }

    const hostIsRed = coinFlipHostIsRed();
    const seats = assignSeats(game.hostPlayerId, args.playerId, hostIsRed);
    const engine = bootstrapGame(game.seed, game.variantName as VariantName);
    const now = Date.now();
    await ctx.db.patch(game._id, {
      ...seats,
      hostIsRed,
      status: "active",
      stateJson: serializeGame(engine),
      redLastSeenAt: now,
      blackLastSeenAt: now,
      matchedAt: now,
      updatedAt: now,
    });

    const seat =
      seats.redPlayerId === args.playerId ? ("red" as const) : ("black" as const);
    return { gameId: game._id, seat, hostIsRed };
  },
});

export const cancelFriendRoom = mutation({
  args: {
    playerId,
    gameId: v.id("onlineGames"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;
    if (game.hostPlayerId !== args.playerId) {
      throw new Error("Only the host can cancel this room");
    }
    if (game.status !== "waiting") {
      throw new Error("Room can only be cancelled while waiting");
    }
    await ctx.db.patch(args.gameId, {
      status: "abandoned",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const joinRandomQueue = mutation({
  args: {
    playerId,
    variantName,
  },
  returns: v.union(
    v.object({
      status: v.literal("matched"),
      gameId: v.id("onlineGames"),
      seat: v.union(v.literal("red"), v.literal("black")),
      hostIsRed: v.boolean(),
    }),
    v.object({
      status: v.literal("waiting"),
      queueId: v.id("matchQueue"),
    }),
  ),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    await assertCanCreateOnlineGame(ctx);

    const prior = await ctx.db
      .query("matchQueue")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    for (const row of prior) {
      await ctx.db.delete(row._id);
    }

    const waiting = await ctx.db
      .query("matchQueue")
      .withIndex("by_variant_and_created", (q) =>
        q.eq("variantName", args.variantName),
      )
      .collect();

    const partner = waiting.find((row) => row.playerId !== args.playerId);
    if (!partner) {
      const queueId = await ctx.db.insert("matchQueue", {
        playerId: args.playerId,
        variantName: args.variantName,
        createdAt: Date.now(),
      });
      return { status: "waiting" as const, queueId };
    }

    await ctx.db.delete(partner._id);

    const now = Date.now();
    const seed = `rnd-${now.toString(36)}-${Math.floor(Math.random() * 1e6)}`;
    const engine = bootstrapGame(seed, args.variantName);
    const hostPlayerId = partner.playerId;
    const hostIsRed = coinFlipHostIsRed();
    const seats = assignSeats(hostPlayerId, args.playerId, hostIsRed);

    const gameId = await ctx.db.insert("onlineGames", {
      status: "active",
      entry: "random",
      variantName: args.variantName,
      seed,
      hostPlayerId,
      ...seats,
      hostIsRed,
      stateJson: serializeGame(engine),
      redLastSeenAt: now,
      blackLastSeenAt: now,
      matchedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const seat =
      seats.redPlayerId === args.playerId ? ("red" as const) : ("black" as const);
    return {
      status: "matched" as const,
      gameId,
      seat,
      hostIsRed,
    };
  },
});

export const leaveRandomQueue = mutation({
  args: { playerId },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const rows = await ctx.db
      .query("matchQueue")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return null;
  },
});

export const findMyActiveGame = query({
  args: { playerId, now: v.number() },
  returns: v.union(
    v.object({
      gameId: v.id("onlineGames"),
      seat: v.union(v.literal("red"), v.literal("black")),
      status: v.union(
        v.literal("waiting"),
        v.literal("active"),
        v.literal("finished"),
        v.literal("abandoned"),
      ),
      hostIsRed: v.union(v.boolean(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    void args.now;

    const waiting = await ctx.db
      .query("onlineGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
    const active = await ctx.db
      .query("onlineGames")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const mine = [...waiting, ...active]
      .filter(
        (g) =>
          g.redPlayerId === args.playerId || g.blackPlayerId === args.playerId,
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    const game = mine[0];
    if (!game) return null;

    return {
      gameId: game._id,
      seat:
        game.redPlayerId === args.playerId
          ? ("red" as const)
          : ("black" as const),
      status: game.status,
      hostIsRed: game.hostIsRed ?? null,
    };
  },
});

/**
 * Keep this player alive. If the opponent has gone stale, award a forfeit win.
 */
export const heartbeat = mutation({
  args: {
    playerId,
    gameId: v.id("onlineGames"),
  },
  returns: v.object({
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("abandoned"),
    ),
  }),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return { status: "abandoned" as const };
    }
    if (game.status === "finished" || game.status === "abandoned") {
      return { status: game.status };
    }

    const isRed = game.redPlayerId === args.playerId;
    const isBlack = game.blackPlayerId === args.playerId;
    if (!isRed && !isBlack) {
      throw new Error("Not a player in this game");
    }

    const now = Date.now();
    const patch: {
      updatedAt: number;
      redLastSeenAt?: number;
      blackLastSeenAt?: number;
    } = { updatedAt: now };
    if (isRed) patch.redLastSeenAt = now;
    if (isBlack) patch.blackLastSeenAt = now;
    await ctx.db.patch(args.gameId, patch);

    if (game.status === "active" && game.blackPlayerId) {
      const oppSeen = isRed ? game.blackLastSeenAt : game.redLastSeenAt;
      if (
        canClaimPresenceForfeit(game.matchedAt, game.createdAt, now) &&
        isStale(oppSeen, game.createdAt, now)
      ) {
        const winner: "red" | "black" = isRed ? "red" : "black";
        await finishByForfeit(ctx, args.gameId, winner, now);
        return { status: "finished" as const };
      }
    }

    return { status: game.status };
  },
});

/**
 * Soft leave (tab close / pagehide). Does NOT award an immediate forfeit —
 * that was racing with React remounts and false "escape" wins at match start.
 * Presence simply stops updating; opponent heartbeat / cron claims forfeit
 * after HEARTBEAT_STALE_MS. Intentional quit still uses forfeitGame.
 */
export const disconnect = mutation({
  args: {
    playerId,
    gameId: v.id("onlineGames"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;
    if (game.status === "finished" || game.status === "abandoned") return null;

    const isRed = game.redPlayerId === args.playerId;
    const isBlack = game.blackPlayerId === args.playerId;
    if (!isRed && !isBlack) return null;

    const now = Date.now();

    if (game.status === "waiting") {
      if (game.hostPlayerId === args.playerId) {
        await ctx.db.patch(args.gameId, {
          status: "abandoned",
          updatedAt: now,
        });
      }
      return null;
    }

    // Active match: stop refreshing this seat's presence only.
    // Do not backdate lastSeen (that made the opponent win on the next tick).
    return null;
  },
});

/** Explicit quit from the UI — opponent wins by forfeit. */
export const forfeitGame = mutation({
  args: {
    playerId,
    gameId: v.id("onlineGames"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;
    if (game.status !== "active") return null;

    const isRed = game.redPlayerId === args.playerId;
    const isBlack = game.blackPlayerId === args.playerId;
    if (!isRed && !isBlack) {
      throw new Error("Not a player in this game");
    }

    const now = Date.now();
    const winner: "red" | "black" = isRed ? "black" : "red";
    await finishByForfeit(ctx, args.gameId, winner, now);
    return null;
  },
});

export const abandonGame = mutation({
  args: {
    playerId,
    gameId: v.id("onlineGames"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Prefer forfeit when a real match is underway.
    assertPlayerId(args.playerId);
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;
    if (
      game.redPlayerId !== args.playerId &&
      game.blackPlayerId !== args.playerId
    ) {
      throw new Error("Not a player in this game");
    }
    if (game.status === "finished" || game.status === "abandoned") return null;

    if (game.status === "active" && game.blackPlayerId) {
      const isRed = game.redPlayerId === args.playerId;
      const winner: "red" | "black" = isRed ? "black" : "red";
      await finishByForfeit(ctx, args.gameId, winner, Date.now());
      return null;
    }

    await ctx.db.patch(args.gameId, {
      status: "abandoned",
      updatedAt: Date.now(),
    });
    return null;
  },
});
