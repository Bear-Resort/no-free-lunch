import { useState } from "react";
import { Pickaxe } from "lucide-react";
import { LUNCH_BREAK, STANDARD, type Variant } from "@engine/generation";
import { ForestBackdrop } from "@/components/game/ForestBackdrop";
import { GoldDust } from "@/components/game/GoldDust";
import { FloatingCode, WarningSign } from "@/components/home/ForestSigns";
import { OrbitalHero } from "@/components/home/OrbitalHero";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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

/** The clearing at the edge of the black forest — first screen. */
export function Home({
  onStart,
}: {
  onStart: (variant: Variant, opponent: Opponent) => void;
}) {
  const [picking, setPicking] = useState<Opponent | null>(null);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-6 py-5 sm:px-10">
      <ForestBackdrop />
      <GoldDust />
      <FloatingCode />

      {/* Top bar */}
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

      {/* Center: the gilded map-cross burning in the dark */}
      <main className="relative flex flex-1 items-center justify-center py-8">
        <OrbitalHero />
      </main>

      <WarningSign className="absolute bottom-36 right-10 hidden md:block" />

      {/* Bottom bar: stats · CTA · modes */}
      <footer className="relative grid items-end gap-6 sm:grid-cols-3">
        <div className="flex gap-8">
          <Stat label="Hidden truth" value="3,630,455" sub="possible formulas" />
          <Stat label="Final exam" value="81" sub="cells · one missing student" />
        </div>

        <div className="flex flex-col items-start sm:items-center">
          <button
            onClick={() => setPicking("agent")}
            className="border-2 border-ink/60 bg-transparent px-10 py-4 text-sm font-bold uppercase tracking-[0.3em] text-ink transition-all hover:border-gold hover:bg-gold hover:text-[#1a140a]"
          >
            Enter the forest
          </button>
          <div className="mt-3 text-center font-mono text-xs tracking-[0.14em] text-ink-muted/80">
            by @James · @Tina · @Bear_resort — for Build Week
          </div>
        </div>

        <nav className="flex flex-col items-start gap-2 text-sm font-semibold uppercase tracking-[0.2em] sm:items-end">
          <button
            onClick={() => setPicking("agent")}
            className="text-ink-muted transition-colors hover:text-gold"
          >
            Face Codex's Assayer
          </button>
          <button
            onClick={() => setPicking("human")}
            className="text-ink-muted transition-colors hover:text-gold"
          >
            Shared nightmare
          </button>
          <span className="cursor-default text-ink-muted/50">
            Online · soon
          </span>
        </nav>
      </footer>

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
            <Button
              onClick={() => onStart(LUNCH_BREAK, picking ?? "human")}
            >
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
    </div>
  );
}
