import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Classic octagon STOP — optional advisory, never gates Enter. */
function StopSign({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("drop-shadow-md", className)}
      aria-hidden
    >
      <polygon
        points="30,6 70,6 94,30 94,70 70,94 30,94 6,70 6,30"
        fill="#cf4631"
        stroke="#e8e4d2"
        strokeWidth="4"
      />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill="#e8e4d2"
        fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="0.08em"
      >
        STOP
      </text>
    </svg>
  );
}

/** Top-right advisory: Statistical No Free Lunch Theorem (optional click). */
export function NflTheoremStop({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Stop, check before play — Statistical No Free Lunch Theorem"
        title="Stop, check before play"
        className={cn(
          "group flex flex-col items-center gap-1.5 text-ink-muted transition-colors hover:text-danger",
          className,
        )}
      >
        <span className="flex size-14 items-center justify-center transition-transform group-hover:scale-105 sm:size-16">
          <StopSign className="size-12 sm:size-14" />
        </span>
        <span className="max-w-[8.5rem] text-center font-mono text-[9px] font-semibold uppercase leading-tight tracking-[0.12em]">
          Stop, check
          <br />
          before play
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Statistical No Free Lunch Theorem</DialogTitle>
          <DialogDescription className="sr-only">
            Brief note on the No Free Lunch theorems in search and learning.
          </DialogDescription>

          <div className="mt-4 flex justify-center">
            <StopSign className="size-16" />
          </div>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
            <p>
              The{" "}
              <span className="font-semibold text-ink">
                No Free Lunch (NFL) theorems
              </span>{" "}
              (Wolpert &amp; Macready) say that, averaged over{" "}
              <em>all</em> possible problems, every search or learning algorithm
              performs the same. Gain on one class of tasks is paid for by loss
              on another.
            </p>
            <p>
              There is no universally best strategy without assumptions about
              the world you are searching. Bias is not optional — it is the
              lunch you pay for.
            </p>
            <p className="border border-edge/70 bg-surface/50 px-3 py-2 font-mono text-[11px] tracking-[0.04em] text-ink">
              In this forest: dig, deduce, or both. Codex already priced the
              menu. Choose your bias carefully.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
