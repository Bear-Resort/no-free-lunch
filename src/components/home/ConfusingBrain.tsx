import { useState, type ReactNode } from "react";
import { Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const FOREST_INTRO_KEY = "nfl.forestIntroSeen.v1";

export function hasSeenForestIntro(): boolean {
  try {
    return window.localStorage.getItem(FOREST_INTRO_KEY) === "true";
  } catch {
    return false;
  }
}

export function markForestIntroSeen(): void {
  try {
    window.localStorage.setItem(FOREST_INTRO_KEY, "true");
  } catch {
    /* private mode */
  }
}

type Step = {
  title: string;
  body: string;
  art: ReactNode;
};

/** Tiny 9×9 schematic used in intro panels. */
function MiniBoard({
  cells,
  dense = false,
}: {
  cells: Array<"empty" | "gold" | "red" | "blue" | "cross" | "dim">;
  /** Fits inside the small map cards (≈56px). */
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-fit grid-cols-9 gap-px rounded-sm border border-edge bg-edge p-px",
        dense && "shrink-0",
      )}
      style={{ boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)" }}
      aria-hidden
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className={cn(
            dense ? "size-1" : "size-3 sm:size-3.5",
            c === "empty" && "bg-[#1d2416]",
            c === "dim" && "bg-[#151a10]",
            c === "gold" && "bg-gold",
            c === "red" && "bg-seat-red",
            c === "blue" && "bg-seat-blue",
            c === "cross" && "bg-ink/70",
          )}
        />
      ))}
    </div>
  );
}

function boardFrom(
  marks: Record<number, "empty" | "gold" | "red" | "blue" | "cross" | "dim">,
  fill: "empty" | "dim" = "empty",
) {
  return Array.from({ length: 81 }, (_, i) => marks[i] ?? fill);
}

const STEPS: Step[] = [
  {
    title: "A secret under the forest",
    body: "Codex hid gold on a 9×9 grid using a boolean formula over maps (AND / OR / XOR). You never see the formula — only what you dig, and what the machines confess.",
    art: (
      <div className="flex flex-col items-center gap-3">
        <MiniBoard
          cells={boardFrom({
            10: "gold",
            12: "gold",
            20: "gold",
            30: "gold",
            40: "gold",
            50: "gold",
            60: "gold",
            70: "gold",
          })}
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          true layout · hidden
        </p>
      </div>
    ),
  },
  {
    title: "Drill a cell",
    body: "Each turn: dig one undrilled square. Gold pays +3 to the digger and paints the cell in your color. Both players see every strike — information leaks both ways.",
    art: (
      <div className="flex flex-col items-center gap-3">
        <MiniBoard
          cells={boardFrom({
            20: "red",
            30: "blue",
            40: "red",
            41: "gold",
            50: "blue",
          })}
        />
        <div className="flex gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          <span>
            <span className="inline-block size-2 bg-seat-red align-middle" /> red dig
          </span>
          <span>
            <span className="inline-block size-2 bg-seat-blue align-middle" /> blue dig
          </span>
          <span>
            <span className="inline-block size-2 bg-gold align-middle" /> ember
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "Maps arrive late",
    body: "Map 1 is public at the start. Maps 2–5 unlock after turns 7 / 14 / 21 / 28. Truth is a combination of maps — a single map is usually a lie.",
    art: (
      <div className="flex flex-wrap items-end justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex size-14 items-center justify-center overflow-hidden border border-edge sm:size-16",
                n === 1 ? "bg-surface" : "bg-elevated/40 opacity-50",
              )}
            >
              {n === 1 ? (
                <MiniBoard
                  dense
                  cells={boardFrom(
                    { 4: "cross", 13: "cross", 22: "cross", 31: "cross", 40: "cross" },
                    "dim",
                  )}
                />
              ) : (
                <span className="font-pixel text-lg text-ink-muted">?</span>
              )}
            </div>
            <span className="font-mono text-[9px] tracking-[0.12em] text-ink-muted">
              map {n}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Wire the machines",
    body: "On a map attempt, feed two maps into AND, OR, or XOR. Budget is shared (5 uses in Standard, 3 in Lunch Break). Build a full 9×9 candidate, then submit.",
    art: (
      <div className="flex flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        <div className="flex items-center gap-2 text-ink">
          <span className="border border-edge px-2 py-1">Map A</span>
          <span className="text-gold">⊕</span>
          <span className="border border-edge px-2 py-1">Map B</span>
          <span>→</span>
          <span className="border border-gold/50 bg-gold/10 px-2 py-1 text-gold">
            out
          </span>
        </div>
        <p className="max-w-xs text-center normal-case tracking-normal text-ink-muted">
          AND = both · OR = either · XOR = exactly one
        </p>
      </div>
    ),
  },
  {
    title: "Hot, warm, cold",
    body: "Wrong attempts never show which cells failed — only a temperature. HOT ≤5 wrong · WARM 6–15 · COLD 16+. Correct map = instant win.",
    art: (
      <div className="flex justify-center gap-3">
        {(
          [
            { label: "HOT", cls: "border-danger text-danger bg-danger/10" },
            { label: "WARM", cls: "border-gold text-gold bg-gold/10" },
            { label: "COLD", cls: "border-accent text-accent bg-accent/10" },
          ] as const
        ).map((t) => (
          <div
            key={t.label}
            className={cn(
              "flex size-16 flex-col items-center justify-center border font-pixel text-lg sm:size-20",
              t.cls,
            )}
          >
            {t.label}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "How the exam ends",
    body: "Win by submitting the true map, or by highest drill score when all gold is found / turn cap hits (40 Standard, 20 Lunch Break). Red moves first. Equal scores = draw.",
    art: (
      <div className="mx-auto max-w-sm space-y-2 border border-edge/80 bg-surface/40 px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ink-muted">
        <p>
          <span className="text-gold">1.</span> Correct map attempt → win
        </p>
        <p>
          <span className="text-gold">2.</span> All embers dug → higher score
        </p>
        <p>
          <span className="text-gold">3.</span> Turn cap → higher score
        </p>
        <p>
          <span className="text-gold">4.</span> Tie scores → draw
        </p>
      </div>
    ),
  },
];

/** Top-left brain latch — opens a walkthrough of rules with example panels. */
export function ConfusingBrain({
  className,
  nudge = false,
  onIntroComplete,
  onOpenChange,
}: {
  className?: string;
  /** Pulse + arrow when the player tries Enter before finishing the intro. */
  nudge?: boolean;
  onIntroComplete?: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;

  function setIntroOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function openIntro() {
    setStep(0);
    setIntroOpen(true);
  }

  function finishIntro() {
    markForestIntroSeen();
    setIntroOpen(false);
    onIntroComplete?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={openIntro}
        aria-label="How to play — a confusing brain explains"
        title="How to play"
        className={cn(
          "group relative flex flex-col items-center gap-1.5 text-ink-muted transition-colors hover:text-gold",
          nudge && "text-gold",
          className,
        )}
      >
        {nudge && (
          <span
            aria-hidden
            className="brain-nudge-arrow pointer-events-none absolute -right-2 top-6 z-20 flex items-center gap-1 sm:-right-28 sm:top-8"
          >
            <span className="hidden max-w-[7rem] text-right font-mono text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-gold sm:block">
              start here
            </span>
            <span className="animate-bounce font-pixel text-3xl leading-none text-gold drop-shadow-[0_0_8px_rgba(227,161,62,0.55)] sm:text-4xl">
              ←
            </span>
          </span>
        )}
        <span
          className={cn(
            "relative flex size-14 items-center justify-center border-2 border-ink/50 bg-elevated/70 transition-all group-hover:border-gold group-hover:bg-gold/10 sm:size-16",
            nudge && "animate-pulse border-gold bg-gold/15 ring-2 ring-gold/40",
          )}
        >
          <Brain className="size-7 text-ink transition-transform duration-300 group-hover:rotate-6 group-hover:text-gold sm:size-8" />
          <span
            aria-hidden
            className="absolute -right-1 -top-1 font-pixel text-base leading-none text-gold opacity-80 group-hover:opacity-100"
          >
            ?
          </span>
        </span>
        <span className="max-w-[9rem] text-center font-mono text-[9px] font-semibold uppercase leading-tight tracking-[0.12em]">
          −2,147,483,648
          <span
            className={cn(
              "mt-1 block font-normal normal-case tracking-[0.04em] text-ink-muted/80",
              nudge && "text-gold",
            )}
          >
            students trapped
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setIntroOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Game introduction, step {step + 1} of {STEPS.length}
          </DialogDescription>

          <div className="mt-4 min-h-[140px] rounded-md border border-edge/70 bg-bg/60 px-3 py-5">
            {current.art}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            {current.body}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>

            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    i === step ? "bg-gold" : "bg-edge",
                  )}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={finishIntro}>
                Got it
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
