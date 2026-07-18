import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Users, Dices, DoorOpen, Hash } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { LUNCH_BREAK, STANDARD, type Variant } from "@engine/generation";
import { getPlayerId } from "@/lib/playerId";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type VariantName = "lunch-break" | "standard";

export type OnlineReady = {
  gameId: Id<"onlineGames">;
  seat: "red" | "black";
  variant: Variant;
  seed: string;
  roomCode: string | null;
  hostIsRed: boolean;
};

type Step =
  | { name: "menu" }
  | { name: "friend" }
  | { name: "create" }
  | { name: "join" }
  | { name: "random" }
  | { name: "hosting"; gameId: Id<"onlineGames">; roomCode: string }
  | { name: "queued" };

function variantObj(name: VariantName): Variant {
  return name === "lunch-break" ? LUNCH_BREAK : STANDARD;
}

/** Online entry: random match or friend room (create 4-digit / join). */
export function OnlineLobby({
  open,
  onClose,
  onReady,
}: {
  open: boolean;
  onClose: () => void;
  onReady: (session: OnlineReady) => void;
}) {
  const playerId = useMemo(() => getPlayerId(), []);
  const [now, setNow] = useState(() => Date.now());
  const [step, setStep] = useState<Step>({ name: "menu" });
  const [watchGameId, setWatchGameId] = useState<Id<"onlineGames"> | null>(
    null,
  );
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const capacity = useQuery(api.online.getCapacity, open ? { now } : "skip");
  const createFriendRoom = useMutation(api.online.createFriendRoom);
  const joinFriendRoom = useMutation(api.online.joinFriendRoom);
  const cancelFriendRoom = useMutation(api.online.cancelFriendRoom);
  const joinRandomQueue = useMutation(api.online.joinRandomQueue);
  const leaveRandomQueue = useMutation(api.online.leaveRandomQueue);

  const lobby = useQuery(
    api.online.getLobby,
    open && watchGameId
      ? { gameId: watchGameId, playerId, now }
      : "skip",
  );

  const matchedWhileQueued = useQuery(
    api.online.findMyActiveGame,
    open && step.name === "queued" ? { playerId, now } : "skip",
  );

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 8000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep({ name: "menu" });
      setWatchGameId(null);
      setError(null);
      setPending(false);
      setJoinCode("");
    }
  }, [open]);

  // Queue: discover the game created when someone else matched with us.
  useEffect(() => {
    if (step.name !== "queued" || !matchedWhileQueued) return;
    if (
      matchedWhileQueued.status === "active" ||
      matchedWhileQueued.status === "waiting"
    ) {
      setWatchGameId(matchedWhileQueued.gameId);
    }
  }, [matchedWhileQueued, step.name]);

  // Once lobby is active, hand off to the app.
  useEffect(() => {
    if (!lobby || !watchGameId || !lobby.seat) return;
    if (lobby.status !== "active") return;
    if (lobby.hostIsRed === null) return;
    onReady({
      gameId: watchGameId,
      seat: lobby.seat,
      variant: variantObj(lobby.variantName),
      seed: lobby.seed,
      roomCode: lobby.roomCode,
      hostIsRed: lobby.hostIsRed,
    });
  }, [lobby, watchGameId, onReady]);

  const busy = capacity?.busy === true;

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function onCreate(variantName: VariantName) {
    await run(async () => {
      const res = await createFriendRoom({ playerId, variantName });
      setWatchGameId(res.gameId);
      setStep({
        name: "hosting",
        gameId: res.gameId,
        roomCode: res.roomCode,
      });
    });
  }

  async function onJoin() {
    await run(async () => {
      const res = await joinFriendRoom({ playerId, roomCode: joinCode });
      setWatchGameId(res.gameId);
      setStep({
        name: "hosting",
        gameId: res.gameId,
        roomCode: joinCode.padStart(4, "0"),
      });
    });
  }

  async function onRandom(variantName: VariantName) {
    await run(async () => {
      const res = await joinRandomQueue({ playerId, variantName });
      if (res.status === "matched") {
        setWatchGameId(res.gameId);
      }
      setStep({ name: "queued" });
    });
  }

  async function onCancelHost() {
    if (step.name !== "hosting") return;
    await run(async () => {
      await cancelFriendRoom({ playerId, gameId: step.gameId });
      setWatchGameId(null);
      setStep({ name: "menu" });
    });
  }

  async function onCancelQueue() {
    await run(async () => {
      await leaveRandomQueue({ playerId });
      setWatchGameId(null);
      setStep({ name: "menu" });
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (step.name === "queued") void leaveRandomQueue({ playerId });
          if (step.name === "hosting" && lobby?.waitingForOpponent) {
            void cancelFriendRoom({ playerId, gameId: step.gameId });
          }
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogTitle>Online · across the forest</DialogTitle>
        <DialogDescription>
          Random pair, or a 4-digit room with a friend. At most{" "}
          {capacity?.max ?? 15} live online games — when full, face the Assayer
          instead.
        </DialogDescription>

        {capacity && (
          <div
            className={cn(
              "mt-3 rounded-md border px-3 py-2 font-mono text-xs",
              busy
                ? "border-danger/60 bg-danger/10 text-danger"
                : "border-edge text-ink-muted",
            )}
          >
            {busy
              ? capacity.message
              : `Slots ${capacity.active}/${capacity.max} in use`}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {step.name === "menu" && (
          <div className="mt-5 flex flex-col gap-2">
            <Button
              disabled={pending || busy || capacity === undefined}
              onClick={() => setStep({ name: "random" })}
            >
              <Dices className="size-4" /> Random pair
            </Button>
            <Button
              variant="secondary"
              disabled={pending || busy || capacity === undefined}
              onClick={() => setStep({ name: "friend" })}
            >
              <Users className="size-4" /> Play with a friend
            </Button>
            {busy && (
              <p className="mt-1 text-xs text-ink-muted">
                Server busy — use Face Codex&apos;s Assayer from the home menu.
              </p>
            )}
          </div>
        )}

        {step.name === "friend" && (
          <div className="mt-5 flex flex-col gap-2">
            <Button
              disabled={pending || busy}
              onClick={() => setStep({ name: "create" })}
            >
              <DoorOpen className="size-4" /> Create room
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setStep({ name: "join" })}
            >
              <Hash className="size-4" /> Join with code
            </Button>
            <Button variant="ghost" onClick={() => setStep({ name: "menu" })}>
              Back
            </Button>
          </div>
        )}

        {(step.name === "create" || step.name === "random") && (
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-xs text-ink-muted">
              {step.name === "create"
                ? "Choose the exam length, then share the code."
                : "Choose the exam length for matchmaking."}
            </p>
            <Button
              disabled={pending || busy}
              onClick={() =>
                step.name === "create"
                  ? void onCreate("lunch-break")
                  : void onRandom("lunch-break")
              }
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Lunch Break
            </Button>
            <Button
              variant="secondary"
              disabled={pending || busy}
              onClick={() =>
                step.name === "create"
                  ? void onCreate("standard")
                  : void onRandom("standard")
              }
            >
              Standard
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setStep(
                  step.name === "create" ? { name: "friend" } : { name: "menu" },
                )
              }
            >
              Back
            </Button>
          </div>
        )}

        {step.name === "join" && (
          <div className="mt-5 flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              4-digit room code
            </label>
            <input
              inputMode="numeric"
              maxLength={4}
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="0000"
              className="rounded-md border border-edge bg-elevated px-3 py-2 font-mono text-2xl tracking-[0.4em] text-ink outline-none focus:border-gold"
            />
            <Button
              disabled={pending || joinCode.length !== 4}
              onClick={() => void onJoin()}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Join room"
              )}
            </Button>
            <Button variant="ghost" onClick={() => setStep({ name: "friend" })}>
              Back
            </Button>
          </div>
        )}

        {step.name === "hosting" && (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            {lobby?.waitingForOpponent !== false ? (
              <>
                <p className="text-sm text-ink-muted">
                  Share this code with your friend
                </p>
                <div className="font-mono text-5xl font-bold tracking-[0.35em] text-gold">
                  {step.roomCode}
                </div>
                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  <Loader2 className="size-3.5 animate-spin" /> Waiting for
                  opponent…
                </p>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() => void onCancelHost()}
                >
                  Cancel room
                </Button>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="size-4 animate-spin" /> Opening the exam…
              </p>
            )}
          </div>
        )}

        {step.name === "queued" && (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="size-4 animate-spin" /> Searching the forest
              for a stranger…
            </p>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => void onCancelQueue()}
            >
              Leave queue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
