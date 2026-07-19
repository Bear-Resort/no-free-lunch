import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Classic 3D coin flip (rotateY + toss arc), matching common CSS coin demos:
 * - scene: perspective
 * - toss layer: parabolic up/down
 * - coin: preserve-3d spin on Y
 * - faces: front / backface-hidden back at rotateY(180°)
 * Lands on red (even half-turns) or blue (odd half-turns).
 */
export function CoinFlipOverlay({
  seat,
  onDone,
}: {
  seat: "red" | "black";
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  const outcome = seat === "red" ? "heads" : "tails";

  useEffect(() => {
    const reveal = window.setTimeout(() => setPhase("reveal"), 2600);
    const done = window.setTimeout(onDone, 4000);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [onDone]);

  const label = seat === "red" ? "RED" : "BLUE";
  const color = seat === "red" ? "text-seat-red" : "text-seat-blue";

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-10 bg-black/85 p-6 backdrop-blur-md">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-ink-muted">
        Codex flips the coin
      </div>

      <div className="coin-scene">
        {/* Toss arc (vertical) — separate from the spin */}
        <div className={cn("coin-toss", phase === "spin" && "coin-tossing")}>
          <div
            className={cn(
              "coin",
              phase === "spin" &&
                (outcome === "heads" ? "coin-spin-heads" : "coin-spin-tails"),
              phase === "reveal" &&
                (outcome === "heads" ? "coin-rest-heads" : "coin-rest-tails"),
            )}
          >
            <div className="coin-face coin-heads" aria-hidden>
              <span>R</span>
            </div>
            <div className="coin-face coin-tails" aria-hidden>
              <span>B</span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "coin-shadow",
            phase === "spin" && "coin-shadow-pulse",
          )}
        />
      </div>

      {phase === "reveal" ? (
        <div className="animate-in fade-in zoom-in-95 text-center duration-300">
          <div
            className={cn(
              "font-display text-4xl font-bold tracking-[0.2em]",
              color,
            )}
          >
            You are {label}
          </div>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            {seat === "red" ? "You pin first" : "You answer after Red"}
          </p>
        </div>
      ) : (
        <p className="h-5 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          &nbsp;
        </p>
      )}
    </div>
  );
}
