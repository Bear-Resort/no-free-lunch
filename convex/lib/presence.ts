/** Presence / stale-game thresholds for online capacity cleanup. */
export const HEARTBEAT_STALE_MS = 45_000;
/**
 * After a match starts, ignore "stale opponent" forfeits briefly so both
 * clients can mount OnlineGame and send their first heartbeat.
 */
export const MATCH_FORFEIT_GRACE_MS = 20_000;
/** Waiting host with no heartbeat for this long → abandon the lobby. */
export const WAITING_HOST_STALE_MS = 90_000;

export function coinFlipHostIsRed(): boolean {
  return Math.random() < 0.5;
}

export function assignSeats(
  hostPlayerId: string,
  guestPlayerId: string,
  hostIsRed: boolean,
): { redPlayerId: string; blackPlayerId: string } {
  return hostIsRed
    ? { redPlayerId: hostPlayerId, blackPlayerId: guestPlayerId }
    : { redPlayerId: guestPlayerId, blackPlayerId: hostPlayerId };
}
