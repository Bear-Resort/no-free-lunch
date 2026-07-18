const KEY = "nfl.playerId";

/** Stable anonymous seat id for online lobbies (localStorage). */
export function getPlayerId(): string {
  const existing = localStorage.getItem(KEY);
  if (existing && existing.length >= 16) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem(KEY, id);
  return id;
}
