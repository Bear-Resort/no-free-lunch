import { useEffect, useState, type ReactNode } from "react";
import { Pickaxe } from "lucide-react";
import { LUNCH_BREAK, STANDARD, type Variant } from "@engine/generation";
import { ForestBackdrop } from "@/components/game/ForestBackdrop";
import { GoldDust } from "@/components/game/GoldDust";
import { FloatingCode, WarningSign } from "@/components/home/ForestSigns";
import {
  AssayerArt,
  OnlineArt,
  SharedArt,
} from "@/components/home/ModeArt";
import { OnlineLobby, type OnlineReady } from "@/components/home/OnlineLobby";
import { OrbitalHero } from "@/components/home/OrbitalHero";
import {
  ConfusingBrain,
  hasSeenForestIntro,
} from "@/components/home/ConfusingBrain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Opponent = "human" | "agent";

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted/85">
        {label}
      </div>
      <div className="mt-0.5 font-display text-3xl font-bold tabular-nums">
        {value}
      </div>
      <div className="text-xs uppercase tracking-[0.15em] text-ink-muted/85">
        {sub}
      </div>
    </div>
  );
}

const DEVELOPERS = [
  {
    handle: "@James",
    github: "@james-guo-03",
    href: "https://james-guo-03.github.io",
    site: "james-guo-03.github.io",
  },
  {
    handle: "@Tina",
    github: "@aenorhabditis6",
    href: "https://github.com/aenorhabditis6",
    site: "github.com/aenorhabditis6",
  },
  {
    handle: "@Bear_resort",
    github: "@Bear-Resort",
    href: "https://bear-resort.github.io",
    site: "bear-resort.github.io",
  },
] as const;

/** The clearing at the edge of the black forest — first screen. */
export function Home({
  onStart,
  onOnlineReady,
  convexReady,
}: {
  onStart: (variant: Variant, opponent: Opponent) => void;
  onOnlineReady: (session: OnlineReady) => void;
  /** False when VITE_CONVEX_URL is missing — online stays disabled. */
  convexReady: boolean;
}) {
  const [modeOpen, setModeOpen] = useState(false);
  const [picking, setPicking] = useState<Opponent | null>(null);
  const [onlineOpen, setOnlineOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [nudgeBrain, setNudgeBrain] = useState(false);

  useEffect(() => {
    setIntroDone(hasSeenForestIntro());
  }, []);

  function chooseLocal(opponent: Opponent) {
    setModeOpen(false);
    setPicking(opponent);
  }

  function chooseOnline() {
    if (!convexReady) return;
    setModeOpen(false);
    setOnlineOpen(true);
  }

  function onEnterForest() {
    if (!introDone) {
      setNudgeBrain(true);
      return;
    }
    setModeOpen(true);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-6 py-5 sm:px-10">
      <ForestBackdrop />
      <GoldDust />
      <FloatingCode />

      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pickaxe className="size-4 text-gold" />
          <span className="font-display text-base font-bold uppercase tracking-[0.3em]">
            No Free Lunch
          </span>
        </div>
        <span className="hidden font-mono text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted sm:block">
          A student slept · Codex noticed
        </span>
      </header>

      <main className="relative flex flex-1 items-center justify-center py-8">
        <ConfusingBrain
          className="absolute left-0 top-2 z-10 sm:left-2 sm:top-4 md:left-4"
          nudge={nudgeBrain}
          onIntroComplete={() => {
            setIntroDone(true);
            setNudgeBrain(false);
          }}
          onOpenChange={(open) => {
            if (open) setNudgeBrain(false);
          }}
        />
        <OrbitalHero />
      </main>

      <WarningSign className="absolute bottom-36 right-10 hidden md:block" />

      <footer className="relative grid items-end gap-6 sm:grid-cols-3">
        <div className="flex gap-8">
          <Stat label="Hidden truth" value="3,630,455" sub="possible formulas" />
          <Stat label="Final exam" value="81" sub="cells · one missing student" />
        </div>

        <div className="flex flex-col items-start sm:items-center">
          <button
            type="button"
            aria-disabled={!introDone}
            title={
              introDone
                ? "Choose how to play"
                : "Finish the confusing brain walkthrough first"
            }
            onClick={onEnterForest}
            className={cn(
              "border-2 px-10 py-4 text-sm font-bold uppercase tracking-[0.3em] transition-all",
              introDone
                ? "border-ink/60 bg-transparent text-ink hover:border-gold hover:bg-gold hover:text-[#1a140a]"
                : "cursor-not-allowed border-ink/30 bg-transparent text-ink-muted/45",
            )}
          >
            Enter the forest
          </button>
          {!introDone && (
            <p className="mt-2 max-w-[16rem] text-center font-mono text-[10px] tracking-[0.1em] text-ink-muted/70">
              The brain speaks first.
            </p>
          )}
        </div>

        <div className="flex justify-start sm:justify-end">
          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="max-w-[16rem] text-left font-mono text-[11px] leading-relaxed tracking-[0.12em] text-ink-muted/75 transition-colors hover:text-gold sm:text-right"
          >
            by @James · @Tina · @Bear_resort
            <span className="mt-0.5 block text-[10px] tracking-[0.14em] opacity-80">
              — for Build Week
            </span>
          </button>
        </div>
      </footer>

      {/* Mode picker: three paths in a row */}
      <Dialog open={modeOpen} onOpenChange={setModeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Choose your table</DialogTitle>
          <DialogDescription>
            Three ways into the exam. Pick one path — Codex is already grading.
          </DialogDescription>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ModeTile
              title="Face Codex's Assayer"
              description="Solo vs the forest. You pin red; something colder pins blue."
              art={<AssayerArt />}
              onClick={() => chooseLocal("agent")}
            />
            <ModeTile
              title="Shared nightmare"
              description="Pass the device. Two students, one desk, no professor."
              art={<SharedArt />}
              onClick={() => chooseLocal("human")}
            />
            <ModeTile
              title="Online · random / friend"
              description="Across the clearing — queue, or a 4-digit room with a friend."
              art={<OnlineArt />}
              disabled={!convexReady}
              titleAttr={
                convexReady
                  ? "Random pair or friend room"
                  : "Set VITE_CONVEX_URL in .env.local"
              }
              onClick={chooseOnline}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={picking !== null} onOpenChange={() => setPicking(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>
            {picking === "agent" ? "The Black Forest Exam" : "Pass the curse"}
          </DialogTitle>
          <DialogDescription>
            {picking === "agent"
              ? "A logic student fell asleep over their proof. Codex, god of merciless implication, set the table. You pin red. Something across the table pins blue. You still get to blink."
              : "Two students, one desk, no professor. Red pins first, Blue answers. Pass the device when the forest asks politely."}
          </DialogDescription>

          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={() => onStart(LUNCH_BREAK, picking ?? "human")}>
              Lunch Break — a small academic haunting
            </Button>
            <Button
              variant="secondary"
              onClick={() => onStart(STANDARD, picking ?? "human")}
            >
              Standard — five exhibits and a bad dream
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>The surveyors</DialogTitle>
          <DialogDescription>
            Built for Build Week — three students who wandered into the forest
            and came back with a ruleset.
          </DialogDescription>

          <ul className="mt-5 flex flex-col gap-3">
            {DEVELOPERS.map((dev) => (
              <li key={dev.handle}>
                <a
                  href={dev.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col rounded-md border border-edge/80 px-4 py-3 transition-colors hover:border-gold/50 hover:bg-surface/60"
                >
                  <span className="font-display text-base font-semibold tracking-wide text-ink group-hover:text-gold">
                    {dev.handle}
                  </span>
                  <span className="mt-1 font-mono text-xs tracking-[0.08em] text-ink-muted">
                    {dev.github}
                  </span>
                  <span className="mt-0.5 font-mono text-[11px] tracking-[0.06em] text-gold/80">
                    {dev.site}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {convexReady && (
        <OnlineLobby
          open={onlineOpen}
          onClose={() => setOnlineOpen(false)}
          onReady={(session) => {
            setOnlineOpen(false);
            onOnlineReady(session);
          }}
        />
      )}
    </div>
  );
}

function ModeTile({
  title,
  description,
  art,
  onClick,
  disabled,
  titleAttr,
}: {
  title: string;
  description: string;
  art: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  titleAttr?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={titleAttr}
      onClick={onClick}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-edge bg-surface/40 text-left transition-all",
        "hover:border-gold/60 hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge disabled:hover:bg-surface/40",
      )}
    >
      <div className="aspect-[8/5] w-full border-b border-edge/60">{art}</div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink">
          {title}
        </span>
        <span className="text-xs leading-relaxed text-ink-muted">{description}</span>
      </div>
    </button>
  );
}
