import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { OnlineReady } from "@/components/home/OnlineLobby";
import { CoinFlipOverlay } from "@/components/game/CoinFlipOverlay";
import { LocalGame } from "@/screens/LocalGame";
import { getPlayerId } from "@/lib/playerId";
import { Button } from "@/components/ui/button";

const HEARTBEAT_MS = 8_000;

/** Online session: coin flip → play with seat lock + presence heartbeats. */
export function OnlineGame({
  session,
  onExit,
}: {
  session: OnlineReady;
  onExit: () => void;
}) {
  const playerId = useMemo(() => getPlayerId(), []);
  const [now, setNow] = useState(() => Date.now());
  const [flipDone, setFlipDone] = useState(false);
  const [bothLeft, setBothLeft] = useState(false);

  const heartbeat = useMutation(api.online.heartbeat);
  const disconnect = useMutation(api.online.disconnect);

  const lobby = useQuery(api.online.getLobby, {
    gameId: session.gameId,
    playerId,
    now,
  });

  const onFlipDone = useCallback(() => setFlipDone(true), []);

  // Heartbeat while mounted — also claims forfeit if opponent went stale.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await heartbeat({
          playerId,
          gameId: session.gameId,
        });
        if (!cancelled && res.status === "abandoned") setBothLeft(true);
      } catch {
        /* ignore transient */
      }
      if (!cancelled) setNow(Date.now());
    };
    void tick();
    const id = window.setInterval(() => void tick(), HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [heartbeat, playerId, session.gameId]);

  // Real tab close only — never disconnect on React unmount (Strict Mode
  // remounts would otherwise forfeit the opponent the moment a game starts).
  useEffect(() => {
    const leave = () => {
      void disconnect({ playerId, gameId: session.gameId });
    };
    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeunload", leave);
    };
  }, [disconnect, playerId, session.gameId]);

  useEffect(() => {
    if (lobby?.status === "abandoned") setBothLeft(true);
  }, [lobby?.status]);

  if (bothLeft) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-black/90 p-6 backdrop-blur-md">
        <div className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-gold">
          Connection severed
        </div>
        <p className="max-w-sm text-center text-sm text-ink-muted">
          Both students left the table. Codex closed the docket and freed the
          slot.
        </p>
        <Button onClick={onExit}>Return to the clearing</Button>
      </div>
    );
  }

  return (
    <>
      {!flipDone && (
        <CoinFlipOverlay seat={session.seat} onDone={onFlipDone} />
      )}
      {flipDone && (
        <LocalGame
          seed={session.seed}
          variant={session.variant}
          opponent="human"
          mySeat={session.seat}
          online={{ gameId: session.gameId, playerId }}
          onExit={onExit}
        />
      )}
    </>
  );
}
