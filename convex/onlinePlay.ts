import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { attempt, drill, seatForTurn, type Game } from "./engine/rules";
import type { BB } from "./engine/bitboard";
import { deserializeGame, serializeGame } from "./lib/gameState";

const playerId = v.string();
const bbValidator = v.array(v.number());

function assertPlayerId(id: string): void {
  if (id.length < 16 || id.length > 128) {
    throw new Error("Invalid player id");
  }
}

function seatOf(
  gameDoc: { redPlayerId: string; blackPlayerId?: string },
  id: string,
): "red" | "black" | null {
  if (gameDoc.redPlayerId === id) return "red";
  if (gameDoc.blackPlayerId === id) return "black";
  return null;
}

function assertMyTurn(engine: Game, mySeat: "red" | "black"): void {
  if (engine.status !== "active") throw new Error("Game is finished");
  if (seatForTurn(engine.turn) !== mySeat) {
    throw new Error("Not your turn");
  }
}

/** Live engine snapshot for seated players. */
export const getEngineState = query({
  args: {
    gameId: v.id("onlineGames"),
    playerId,
  },
  returns: v.union(
    v.object({
      stateJson: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("active"),
        v.literal("finished"),
        v.literal("abandoned"),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const doc = await ctx.db.get(args.gameId);
    if (!doc) return null;
    if (!seatOf(doc, args.playerId)) return null;
    if (!doc.stateJson) return null;
    return { stateJson: doc.stateJson, status: doc.status };
  },
});

export const playDrill = mutation({
  args: {
    gameId: v.id("onlineGames"),
    playerId,
    cell: v.number(),
  },
  returns: v.object({ stateJson: v.string() }),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const doc = await ctx.db.get(args.gameId);
    if (!doc || doc.status !== "active" || !doc.stateJson) {
      throw new Error("Game not active");
    }
    const mySeat = seatOf(doc, args.playerId);
    if (!mySeat) throw new Error("Not a player in this game");

    const engine = deserializeGame(doc.stateJson);
    assertMyTurn(engine, mySeat);
    const next = drill(engine, args.cell);
    const stateJson = serializeGame(next);
    await ctx.db.patch(args.gameId, {
      stateJson,
      updatedAt: Date.now(),
      status: next.status === "finished" ? "finished" : "active",
    });
    return { stateJson };
  },
});

export const playAttempt = mutation({
  args: {
    gameId: v.id("onlineGames"),
    playerId,
    layout: bbValidator,
  },
  returns: v.object({ stateJson: v.string() }),
  handler: async (ctx, args) => {
    assertPlayerId(args.playerId);
    const doc = await ctx.db.get(args.gameId);
    if (!doc || doc.status !== "active" || !doc.stateJson) {
      throw new Error("Game not active");
    }
    const mySeat = seatOf(doc, args.playerId);
    if (!mySeat) throw new Error("Not a player in this game");

    if (args.layout.length !== 3) throw new Error("Invalid layout");
    const layout = [args.layout[0]!, args.layout[1]!, args.layout[2]!] as BB;

    const engine = deserializeGame(doc.stateJson);
    assertMyTurn(engine, mySeat);
    const next = attempt(engine, layout);
    const stateJson = serializeGame(next);
    await ctx.db.patch(args.gameId, {
      stateJson,
      updatedAt: Date.now(),
      status: next.status === "finished" ? "finished" : "active",
    });
    return { stateJson };
  },
});
