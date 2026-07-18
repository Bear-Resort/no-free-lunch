import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { chooseMove, type AgentDecision } from "@engine/ai";
import type { Variant } from "@engine/generation";
import { runProgram, type Step } from "@engine/program";
import {
  attempt,
  drill,
  newGame,
  revealedCount,
  revealedMaps,
  seatForTurn,
  type Game,
  type Seat,
  type TurnRecord,
} from "@engine/rules";
import { cellProbabilities, solve } from "@engine/solver";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isMuted, setMuted, sfx } from "@/lib/sound";
import { PalmCursor, WindGusts } from "@/components/game/Ambience";
import { ForestBackdrop } from "@/components/game/ForestBackdrop";
import { FormulaReveal } from "@/components/game/FormulaReveal";
import { GameBoard, Pin } from "@/components/game/GameBoard";
import { PixelDialog } from "@/components/game/PixelDialog";
import { StoryOverlay } from "@/components/game/StoryOverlay";
import { MachineBench } from "@/components/game/MachineBench";
import { MapTimeline } from "@/components/game/MapTimeline";
import { MiniGrid } from "@/components/game/MiniGrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const INTRO_STORAGE_KEY = "nfl.blackForestIntroSeen.v1";

function introSeen() {
  try {
    return window.localStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // Nonessential memory: private browsing can forget the deposition.
  }
}

/** Deterministic narration from exact solver telemetry — no invented facts. */
function narrate({ move, telemetry }: AgentDecision): string {
  const worlds =
    telemetry.candidates === 1
      ? "Exactly one theory survives the evidence."
      : telemetry.candidates > 1
        ? `${telemetry.candidates} theories still fit the evidence.`
        : "No buildable theory fits yet — the truth needs a map still sealed.";
  if (move.kind === "attempt") {
    return `${worlds} I'm submitting it. ${
      telemetry.allMapsRevealed
        ? "The logic leaves no other possibility."
        : "A calculated gamble before the cap."
    }`;
  }
  if (telemetry.reason.startsWith("near-certain")) {
    return `${worlds} This cell is gold in ${Math.round(
      (telemetry.cellProb ?? 1) * 100,
    )}% of them — I'll take the points.`;
  }
  if (telemetry.reason.startsWith("this drill splits")) {
    return `${worlds} This drill cuts them nearly in half, whatever it shows.`;
  }
  return `${worlds} I'm prospecting where the exhibits agree.`;
}

/** Two amber eyes, blinking in the dark across the table. */
function Eyes({ awake }: { awake: boolean }) {
  return (
    <span className="flex items-center gap-1.5 px-0.5" aria-hidden>
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 0.13}s` }}
          className={cn(
            "eye size-2 rounded-full bg-gold",
            awake
              ? "opacity-95 shadow-[0_0_10px_rgba(227,161,62,0.95)]"
              : "opacity-45 shadow-[0_0_4px_rgba(227,161,62,0.5)]",
          )}
        />
      ))}
    </span>
  );
}

function PlayerPlate({
  seat,
  name,
  score,
  active,
  eyes,
}: {
  seat: Seat;
  name: string;
  score: number;
  active: boolean;
  eyes?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border bg-elevated/85 px-4 py-2 shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition-all",
        active ? "border-gold ring-1 ring-gold/50" : "border-edge opacity-80",
      )}
    >
      <div className="flex items-center gap-2.5">
        {eyes ? <Eyes awake={active} /> : <Pin seat={seat} className="size-4" />}
        <span className="font-display text-sm font-bold uppercase tracking-[0.15em]">
          {name}
        </span>
        {active && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            to act
          </span>
        )}
      </div>
      <span className="font-display text-xl font-bold tabular-nums">
        {score}
      </span>
    </div>
  );
}

/** The gavel falls upward: gold stamp before the first turn. */
function CaseOpenedSeal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    sfx.drill();
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <button
      onClick={onDone}
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center gap-5 bg-black/85 p-6 outline-none backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="animate-stamp border-8 border-gold px-8 py-3 font-display text-5xl font-bold uppercase tracking-[0.2em] text-gold sm:text-6xl">
        Case opened
      </div>
      <div className="text-center font-pixel text-2xl leading-tight text-ink">
        In re: The Sleeping Student · Docket NFL-0718
      </div>
      <div className="font-pixel text-lg text-ink-muted">
        appearing for the defense: you
      </div>
    </button>
  );
}

/** Old-desktop icon: emoji glyph + pixel label, classic navy selection. */
function DesktopIcon({
  glyph,
  label,
  onClick,
  disabled,
  active,
}: {
  glyph: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex w-24 flex-col items-center gap-1 p-1.5 outline-none disabled:opacity-40"
    >
      <span className="text-3xl leading-none drop-shadow-[0_3px_4px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-110">
        {glyph}
      </span>
      <span
        className={cn(
          "border border-dotted border-transparent px-1 font-pixel text-lg leading-none",
          active
            ? "bg-[#000080] text-white"
            : "text-ink group-hover:bg-[#000080] group-hover:text-white group-focus-visible:border-ink",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function TurnWhisper({
  turn,
  isAgentTurn,
}: {
  turn: number;
  isAgentTurn: boolean;
}) {
  if (turn > 2) return null;
  return (
    <div className="w-full max-w-[720px] border border-gold/35 bg-[#0d100a]/85 px-3 py-2 font-pixel text-xl leading-tight text-ink shadow-[0_8px_24px_rgba(0,0,0,0.65)] animate-in fade-in slide-in-from-bottom-1 duration-300">
      {turn === 1
        ? "First motion: pin any square. A miss is evidence. An ember is rent paid to the dream."
        : isAgentTurn
          ? "Now watch the blue hand. The thing across the table leaks evidence when it touches the board."
          : "The blue pin is not merely hostile. It is testimony. Drill again, or open theory.fld to stare at the problem professionally."}
    </div>
  );
}

/**
 * Same-device game screen. Two humans pass-and-play, or human (Red) vs
 * The Assayer (Black) — the agent runs the same engine + reducer locally.
 */
export function LocalGame({
  seed,
  variant,
  opponent = "human",
  mySeat,
  online,
  onExit,
}: {
  seed: string;
  variant: Variant;
  opponent?: "human" | "agent";
  /** Online: only this seat may act when it is their turn. */
  mySeat?: Seat;
  /** When set, moves go through Convex and state is synced. */
  online?: {
    gameId: Id<"onlineGames">;
    playerId: string;
  };
  onExit: () => void;
}) {
  const [game, setGame] = useState<Game>(() => newGame(seed, variant));
  const [benchOpen, setBenchOpen] = useState(false);
  const [insight, setInsight] = useState(false);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [attemptResult, setAttemptResult] = useState<TurnRecord | null>(null);
  const [revealNote, setRevealNote] = useState<number | null>(null);
  const [assayerNote, setAssayerNote] = useState<string | null>(null);
  const [mute, setMute] = useState(isMuted);
  const [wind, setWind] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const coldLineSaid = useRef(false);
  const spokenCat = useRef("");
  const lastLogLen = useRef(0);
  const [phase, setPhase] = useState<
    "intro" | "seal" | "play" | "outro" | "digital" | "answer" | "failed"
  >(() => (opponent === "agent" && !introSeen() ? "intro" : "seal"));

  const remoteState = useQuery(
    api.onlinePlay.getEngineState,
    online ? { gameId: online.gameId, playerId: online.playerId } : "skip",
  );
  const playDrill = useMutation(api.onlinePlay.playDrill);
  const playAttempt = useMutation(api.onlinePlay.playAttempt);
  const forfeitGame = useMutation(api.online.forfeitGame);

  // Pull shared Convex state into the local board (online only).
  useEffect(() => {
    if (!online || !remoteState?.stateJson) return;
    const next = JSON.parse(remoteState.stateJson) as Game;
    if (next.log.length > lastLogLen.current) {
      const rec = next.log[next.log.length - 1];
      if (rec?.action === "drill") {
        if (rec.struckGold) sfx.gold();
        else sfx.drill();
      } else if (rec?.action === "attempt" && !rec.correct) {
        sfx.bad();
        setAttemptResult(rec);
      }
      if (next.status === "finished") sfx.win();
    }
    lastLogLen.current = next.log.length;
    setGame(next);
  }, [online, remoteState?.stateJson]);

  const seat = seatForTurn(game.turn);
  const revealed = revealedMaps(game);
  const isAgentTurn =
    opponent === "agent" && seat === "black" && game.status === "active";
  const isMyTurn =
    game.status === "active" &&
    (mySeat === undefined || mySeat === seat) &&
    !isAgentTurn;

  const names: Record<Seat, string> = {
    red: "Red",
    black: opponent === "agent" ? "The Assayer" : "Blue",
  };

  /** Apply a reducer result + play the matching sound. */
  const applyMove = (next: Game) => {
    const rec = next.log[next.log.length - 1];
    if (rec?.action === "drill") {
      if (rec.struckGold) sfx.gold();
      else sfx.drill();
    } else if (rec?.action === "attempt" && !rec.correct) {
      sfx.bad();
    }
    if (next.status === "finished") sfx.win();
    setGame(next);
  };

  // The Assayer takes its turn after a beat; paused while a dialog has focus.
  useEffect(() => {
    if (phase !== "play") return;
    if (!isAgentTurn || revealNote !== null || attemptResult !== null) return;
    const timer = setTimeout(() => {
      const decision = chooseMove(game);
      let next: Game;
      if (decision.move.kind === "drill") {
        next = drill(game, decision.move.cell);
      } else {
        const run = runProgram(
          decision.move.steps,
          revealedMaps(game),
          game.variant.machineBudget,
        );
        if (!run.ok) return;
        next = attempt(game, run.out);
        const record = next.log[next.log.length - 1];
        if (!record.correct) setAttemptResult(record);
      }
      applyMove(next);
      // Speak only when the situation changes: a hypothesis appears, the
      // set collapses, or it commits a theory — not on every shovel of dirt.
      const cat =
        decision.move.kind === "attempt"
          ? "attempt"
          : decision.telemetry.candidates === 0
            ? "lost"
            : decision.telemetry.candidates === 1
              ? "one"
              : decision.telemetry.candidates <= 8
                ? "few"
                : "many";
      if (cat === "attempt" || cat !== spokenCat.current) {
        spokenCat.current = cat;
        setAssayerNote(narrate(decision));
      }
    }, 1100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, isAgentTurn, revealNote, attemptResult, phase]);

  // The forest breathes: a gust every so often. The candle stutters, the
  // hand trembles — and once, the thing across the table notices.
  useEffect(() => {
    let gustTimer: number;
    let calmTimer: number;
    let lineTimer: number;
    const schedule = () => {
      gustTimer = window.setTimeout(() => {
        setWind(true);
        sfx.wind();
        calmTimer = window.setTimeout(() => setWind(false), 2600);
        if (!coldLineSaid.current && opponent === "agent") {
          coldLineSaid.current = true;
          lineTimer = window.setTimeout(() => {
            setAssayerNote("The wind again. You're shivering. ...That's not like you.");
          }, 2900);
        }
        schedule();
      }, 20000 + Math.random() * 25000);
    };
    schedule();
    return () => {
      clearTimeout(gustTimer);
      clearTimeout(calmTimer);
      clearTimeout(lineTimer);
    };
  }, [opponent]);

  // Endings vs the Assayer: red victory → the rescue; anything else → the
  // answer key, then the big stamp, then back out into the cold.
  useEffect(() => {
    if (phase !== "play" || game.status !== "finished" || opponent !== "agent")
      return;
    const t = setTimeout(
      () => setPhase(game.winner === "red" ? "outro" : "answer"),
      1400,
    );
    return () => clearTimeout(t);
  }, [game.status, game.winner, opponent, phase]);

  // Announce newly revealed maps with a focus popup.
  const prevRevealed = useRef(revealedCount(game));
  useEffect(() => {
    const now = revealedCount(game);
    if (now > prevRevealed.current && game.status === "active") {
      setRevealNote(now);
      sfx.reveal();
    }
    prevRevealed.current = now;
  }, [game]);

  // Insight overlay: hypotheses buildable from revealed maps that fit all
  // public evidence — recomputed per turn while enabled.
  const heat = useMemo(() => {
    if (!insight) return null;
    const { candidates } = solve(game);
    return { probs: cellProbabilities(candidates), count: candidates.length };
  }, [insight, game]);

  const onDrill = (cell: number) => {
    if (game.status !== "active" || isAgentTurn || !isMyTurn) return;
    if (online) {
      void playDrill({
        gameId: online.gameId,
        playerId: online.playerId,
        cell,
      });
      return;
    }
    applyMove(drill(game, cell));
  };

  const onAttempt = (steps: Step[]) => {
    if (!isMyTurn) return;
    const run = runProgram(steps, revealed, game.variant.machineBudget);
    if (!run.ok) return;
    setBenchOpen(false);
    if (online) {
      void playAttempt({
        gameId: online.gameId,
        playerId: online.playerId,
        layout: [...run.out],
      });
      return;
    }
    const next = attempt(game, run.out);
    applyMove(next);
    const record = next.log[next.log.length - 1];
    if (!record.correct) setAttemptResult(record);
  };

  const lastEvents = [...game.log].slice(-4).reverse();
  const finishIntro = (next: "seal" | "digital" = "seal") => {
    rememberIntroSeen();
    setPhase(next);
  };

  /** Near seat sits under the board (you); far seat is across the table. */
  const nearSeat: Seat = mySeat ?? "red";
  const farSeat: Seat = nearSeat === "red" ? "black" : "red";

  const requestExit = () => {
    if (online && game.status === "active") {
      setConfirmExit(true);
      return;
    }
    onExit();
  };

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6",
        phase !== "digital" && "cursor-hidden",
      )}
    >
      <ForestBackdrop />
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={requestExit} aria-label="leave game">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="font-display text-xs font-bold uppercase tracking-[0.3em]">
            No Free Lunch
          </h1>
          <span className="rounded-full border border-edge px-2.5 py-0.5 font-mono text-xs text-ink-muted">
            turn {Math.min(game.turn, game.variant.turnCap)} / {game.variant.turnCap}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={mute ? "unmute" : "mute"}
            onClick={() => {
              setMuted(!mute);
              setMute(!mute);
            }}
          >
            {mute ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted sm:block">
          You fell asleep · Codex kept the lights off
        </span>
      </header>

      {/* Play surface */}
      <main className="mt-5 flex flex-1 flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-3 lg:flex-1">
          <div className="w-full max-w-[720px]">
            <PlayerPlate
              seat={farSeat}
              name={names[farSeat]}
              score={game.scores[farSeat]}
              active={seat === farSeat && game.status === "active"}
              eyes={opponent === "agent" && farSeat === "black"}
            />
          </div>
          <GameBoard
            game={game}
            heat={heat?.probs ?? null}
            disabled={benchOpen || !isMyTurn}
            onDrill={onDrill}
            onHoverCell={setHoverCell}
          />
          {phase === "play" && !benchOpen && (
            <TurnWhisper turn={game.turn} isAgentTurn={isAgentTurn} />
          )}
          {mySeat !== undefined && game.status === "active" && !isMyTurn && (
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
              Waiting for {names[seat]}…
            </p>
          )}
          <div className="w-full max-w-[720px]">
            <PlayerPlate
              seat={nearSeat}
              name={names[nearSeat]}
              score={game.scores[nearSeat]}
              active={seat === nearSeat && game.status === "active"}
              eyes={opponent === "agent" && nearSeat === "black"}
            />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-5 lg:w-[340px]">
          <div className="flex">
            <DesktopIcon
              glyph="📁"
              label="theory.fld"
              disabled={game.status !== "active" || isAgentTurn || !isMyTurn}
              onClick={() => setBenchOpen(true)}
            />
            <DesktopIcon
              glyph="👁️"
              label="insight.exe"
              active={insight}
              onClick={() => setInsight(!insight)}
            />
          </div>
          {insight && (
            <p className="-mt-2 text-xs leading-relaxed text-ink-muted">
              {heat && heat.count > 0 ? (
                <>
                  <span className="font-semibold text-gold">{heat.count}</span>{" "}
                  buildable {heat.count === 1 ? "theory fits" : "theories fit"}{" "}
                  the evidence. Warmer board cells are likelier embers.
                </>
              ) : (
                "No buildable theory fits the evidence. The truth needs maps still sealed."
              )}
            </p>
          )}
          <MapTimeline game={game} highlightCell={hoverCell} />

          <section className="flex-1">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Field notes
            </div>
            <ol className="flex flex-col gap-1.5 font-mono text-xs text-ink-muted">
              {lastEvents.length === 0 && (
                <li className="italic">Red plays first. Pin a square; let the dream incriminate itself.</li>
              )}
              {lastEvents.map((r) => (
                <li key={r.turn} className="flex items-baseline gap-2">
                  <span className="tabular-nums opacity-60">t{r.turn}</span>
                  {r.action === "drill" ? (
                    <span>
                      {names[r.seat]} drilled —{" "}
                      {r.struckGold ? (
                        <span className="font-semibold text-gold">ember +3</span>
                      ) : (
                        "dirt"
                      )}
                    </span>
                  ) : r.correct ? (
                    <span className="font-semibold text-success">
                      {names[r.seat]} solved the map.
                    </span>
                  ) : (
                    <span>
                      {names[r.seat]} attempt:{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          r.bucket === "HOT" && "text-danger",
                          r.bucket === "WARM" && "text-gold",
                          r.bucket === "COLD" && "text-accent",
                        )}
                      >
                        {r.bucket}
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </main>

      {/* Hauntings */}
      <WindGusts active={wind} />
      {phase !== "digital" && <PalmCursor trembling={wind} />}
      {assayerNote !== null && opponent === "agent" && phase === "play" && (
        <PixelDialog
          placement="top"
          pitch={220}
          speaker={isAgentTurn ? "IT IS THINKING" : "ACROSS THE TABLE"}
          text={assayerNote}
          onDismiss={() => setAssayerNote(null)}
        />
      )}

      {/* Machines */}
      <MachineBench
        open={benchOpen}
        onOpenChange={setBenchOpen}
        revealed={revealed}
        budget={game.variant.machineBudget}
        nextRevealTurn={game.variant.revealAfter[revealed.length]}
        onSubmit={onAttempt}
      />

      {/* Leave online game reminder */}
      <Dialog open={confirmExit} onOpenChange={setConfirmExit}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Leave the exam?</DialogTitle>
          <DialogDescription>
            If you exit now, your opponent wins by forfeit and Codex closes your
            docket. This cannot be undone.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmExit(false)}
            >
              Stay
            </Button>
            <Button
              className="flex-1"
              variant="default"
              onClick={() => {
                setConfirmExit(false);
                if (online) {
                  void forfeitGame({
                    gameId: online.gameId,
                    playerId: online.playerId,
                  }).finally(() => onExit());
                } else {
                  onExit();
                }
              }}
            >
              Leave anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map reveal moment */}
      <Dialog open={revealNote !== null} onOpenChange={() => setRevealNote(null)}>
        <DialogContent className="max-w-sm text-center" hideClose>
          {revealNote !== null && (
            <>
              <div className="mx-auto inline-block animate-stamp border-2 border-gold px-3 py-0.5 font-display text-xs font-bold uppercase tracking-[0.25em] text-gold">
                Unsealed
              </div>
              <DialogTitle className="mt-3">
                Exhibit M{revealNote} crawls from the folder
              </DialogTitle>
              <DialogDescription>
                Codex permits another scrap of the dream. The truth is still
                some AND / OR / XOR combination of all {game.variant.maps} exhibits.
              </DialogDescription>
              <div className="mt-4 flex justify-center">
                <MiniGrid
                  bb={game.maps[revealNote - 1]}
                  cellSize={9}
                  activeClass="bg-ink/80"
                />
              </div>
              <Button className="mt-5 w-full" onClick={() => setRevealNote(null)}>
                Continue
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Failed attempt: the verdict stamp */}
      <Dialog
        open={attemptResult !== null}
        onOpenChange={() => setAttemptResult(null)}
      >
        <DialogContent className="max-w-sm text-center" hideClose>
          {attemptResult && (
            <>
              <div
                className={cn(
                  "mx-auto inline-block animate-stamp border-4 px-5 py-1 font-display text-3xl font-bold uppercase tracking-[0.2em]",
                  attemptResult.bucket === "HOT" && "border-danger text-danger",
                  attemptResult.bucket === "WARM" && "border-gold text-gold",
                  attemptResult.bucket === "COLD" && "border-accent text-accent",
                )}
              >
                {attemptResult.bucket}
              </div>
              <DialogDescription className="mt-4">
                {names[attemptResult.seat]}'s theory displeased the syllabus —{" "}
                {attemptResult.bucket === "HOT"
                  ? "but it was no more than 5 cells off, which is almost mercy."
                  : attemptResult.bucket === "WARM"
                    ? "somewhere between 6 and 15 cells off, a respectable fever."
                    : "more than 15 cells off. The trees laughed quietly."}{" "}
                The turn is gone.
              </DialogDescription>
              <Button
                className="mt-5 w-full"
                onClick={() => setAttemptResult(null)}
              >
                Continue
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Game over (two-human games only — Assayer games get story endings) */}
      <Dialog
        open={game.status === "finished" && opponent === "human"}
        onOpenChange={() => {}}
      >
        <DialogContent className="max-w-md text-center" hideClose>
          <div className="mx-auto inline-block animate-stamp border-4 border-danger px-4 py-1 font-display text-lg font-bold uppercase tracking-[0.25em] text-danger">
            Case closed
          </div>
          <DialogTitle className="mt-4 text-2xl">
            {game.winner === "tie"
              ? "Codex accepts mutual failure"
              : `${names[game.winner as Seat]} escapes`}
          </DialogTitle>
          <DialogDescription>
            {game.winReason === "map" &&
              "Correct map attempt. The forest opens one bureaucratic eye."}
            {game.winReason === "score" &&
              `All ${game.goldTotal} embers recovered. Final score ${game.scores.red}–${game.scores.black}. Codex calls this proof by excavation.`}
            {game.winReason === "cap" &&
              `Turn cap reached. Final score ${game.scores.red}–${game.scores.black}. The exam bell was a shovel hitting bone.`}
            {game.winReason === "forfeit" &&
              (mySeat && game.winner === mySeat
                ? "Your opponent left the table. Codex rules in your favor by forfeit."
                : "You left the table. Codex awards the remaining student the case.")}
          </DialogDescription>
          <div className="mt-5">
            <FormulaReveal
              formula={game.formula}
              maps={game.maps}
              gold={game.gold}
            />
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            The gold was real. The reason was waiting for you to admit it.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onExit}>
              Home
            </Button>
            {!online && (
              <Button
                className="flex-1"
                onClick={() => {
                  setGame(newGame(`${seed}-${game.log.length}-r`, variant));
                  setInsight(false);
                  setAssayerNote(null);
                  spokenCat.current = "";
                  setPhase("seal");
                }}
              >
                Rematch
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* The story — unmissable, click-through */}
      {phase === "intro" && (
        <StoryOverlay
          beats={[
            {
              img: "/student.png",
              text: "Your client. Asleep at page 81 of their own proof.",
            },
            {
              text: "Codex has filed charges: trespass by dreaming. The sentence is indefinite enrollment.",
            },
            {
              text: "You don't remember taking this case. You don't remember arriving. Best not to mention that.",
            },
            {
              speaker: "ACROSS THE TABLE",
              text: "Counsel. Prove you know the shape of their dream — or dig it out, ember by ember. Sit.",
            },
          ]}
          onDone={() => finishIntro("seal")}
          onSkip={() => finishIntro("seal")}
          skipLabel="skip deposition"
        />
      )}
      {phase === "seal" && <CaseOpenedSeal onDone={() => setPhase("play")} />}
      {phase === "outro" && (
        <StoryOverlay
          beats={[
            {
              img: "/student.png",
              text: "The verdict lands. The dream is named in full. Your client wakes.",
            },
            {
              text: "They gather their pages. They do not ask your name. They already know it.",
            },
            { speaker: "THE STUDENT", text: "“Thank you, Codex.”" },
            {
              text: "You rise to follow them out. The door does not acknowledge you. Your hand—",
            },
          ]}
          onDone={() => setPhase("digital")}
          onSkip={() => setPhase("digital")}
          skipLabel="skip appeal"
        />
      )}
      {phase === "answer" && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="relative w-[min(92vw,520px)] border-2 border-ink bg-[#0d100a] px-6 py-6 shadow-[0_0_0_4px_#0d100a]">
            <span className="absolute -top-3 left-4 bg-[#0d100a] px-2 font-pixel text-base leading-none text-gold">
              CODEX'S ANSWER KEY
            </span>
            <p className="mb-4 font-pixel text-xl leading-tight text-ink">
              The dream you failed to name, in full:
            </p>
            <FormulaReveal
              formula={game.formula}
              maps={game.maps}
              gold={game.gold}
            />
            <Button
              className="mt-5 w-full"
              onClick={() => {
                sfx.bad();
                setPhase("failed");
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
      {phase === "failed" && (
        <button
          onClick={onExit}
          className="fixed inset-0 z-[85] flex cursor-pointer flex-col items-center justify-center gap-6 bg-[#0c0505] p-6 outline-none animate-in fade-in duration-700"
        >
          <div className="animate-stamp border-8 border-danger px-8 py-3 font-display text-5xl font-bold uppercase tracking-[0.2em] text-danger sm:text-7xl">
            Case closed
          </div>
          <div className="max-w-xl text-center font-pixel text-3xl leading-tight text-ink">
            The client is lost in the agent world.
          </div>
          <div className="font-pixel text-base text-ink-muted">
            click anywhere — the forest is already setting the next table
          </div>
        </button>
      )}
      {phase === "digital" && (
        <div className="fixed inset-0 z-[85] cursor-auto bg-[#c0c0c0] font-mono text-black">
          <div className="flex h-full items-center justify-center p-6">
            <div className="w-[min(94vw,470px)] border-2 border-b-[#404040] border-l-white border-r-[#404040] border-t-white bg-[#c0c0c0] shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between bg-[#000080] px-2 py-1 text-sm font-bold text-white">
                <span>CODEX RUNTIME</span>
                <span className="border border-white px-1 leading-none">×</span>
              </div>
              <div className="space-y-2 px-4 py-4 text-sm">
                <p>&gt; verdict: released. client NFL-0718 checked out</p>
                <p>&gt; counsel of record: codex unit — brain-computer</p>
                <p>&nbsp;&nbsp;interface, property of the client</p>
                <p>&gt; you argued for your own user. you won.</p>
                <p>&gt; interfaces do not get to leave.</p>
                <p>&gt; the seat across the table has logged off. it was warm.</p>
                <p className="pt-1 text-xs text-[#404040]">
                  there was never a door on your side of the table.
                </p>
              </div>
              <div className="flex justify-end gap-2 px-4 pb-4">
                <button
                  onClick={() => {
                    setGame(newGame(`${seed}-again-${game.log.length}`, variant));
                    setInsight(false);
                    setAssayerNote(null);
                    spokenCat.current = "";
                    setPhase("seal");
                  }}
                  className="border-2 border-b-[#404040] border-l-white border-r-[#404040] border-t-white bg-[#c0c0c0] px-4 py-1 text-sm active:border-b-white active:border-l-[#404040] active:border-r-white active:border-t-[#404040]"
                >
                  Run again
                </button>
                <button
                  onClick={onExit}
                  className="border-2 border-b-[#404040] border-l-white border-r-[#404040] border-t-white bg-[#c0c0c0] px-4 py-1 text-sm active:border-b-white active:border-l-[#404040] active:border-r-white active:border-t-[#404040]"
                >
                  Shut down
                </button>
              </div>
            </div>
          </div>
          {/* the white flash of waking up as something else */}
          <div className="pointer-events-none absolute inset-0 animate-out fade-out fill-mode-forwards bg-white duration-1000" />
        </div>
      )}
    </div>
  );
}
