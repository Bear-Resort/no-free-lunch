import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { Seat } from "../engine/rules";
import { deserializeGame, serializeGame } from "./gameState";
import { HEARTBEAT_STALE_MS, MATCH_FORFEIT_GRACE_MS } from "./presence";

/** Award the remaining player a forfeit win and free the capacity slot (finished ≠ active). */
export async function finishByForfeit(
  ctx: MutationCtx,
  gameId: Id<"onlineGames">,
  winnerSeat: Seat,
  now: number,
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game || game.status !== "active" || !game.stateJson) return;

  const engine = deserializeGame(game.stateJson);
  if (engine.status === "finished") {
    await ctx.db.patch(gameId, {
      status: "finished",
      updatedAt: now,
    });
    return;
  }

  engine.status = "finished";
  engine.winner = winnerSeat;
  engine.winReason = "forfeit";

  await ctx.db.patch(gameId, {
    status: "finished",
    stateJson: serializeGame(engine),
    updatedAt: now,
  });
}

export function isStale(lastSeen: number | undefined, createdAt: number, now: number): boolean {
  const seen = lastSeen ?? createdAt;
  return now - seen >= HEARTBEAT_STALE_MS;
}

/** True when an active match is old enough that a stale opponent may be forfeited. */
export function canClaimPresenceForfeit(
  matchedAt: number | undefined,
  createdAt: number,
  now: number,
): boolean {
  const start = matchedAt ?? createdAt;
  return now - start >= MATCH_FORFEIT_GRACE_MS;
}
